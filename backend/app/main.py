import hashlib
import json
import os
import re
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func, inspect, select, text
from sqlalchemy.orm import Session, joinedload

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from .database import Base, engine, get_db
from .models import Applicant, AuditLog, Document, KycApplication, PortalSubmissionRecord, RiskAssessment, User, VerificationResult
from .schemas import ApplicantInput, AuthInput, LoginInput, StatusInput
from .security import current_user, hash_password, issue_token, verify_password
from .storage import storage

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024
ALLOWED_TYPES = {"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if engine.dialect.name == "sqlite":
        with engine.begin() as connection:
            for table in ("verification_results", "risk_assessments"):
                columns = {column["name"] for column in inspect(connection).get_columns(table)}
                if "is_current" not in columns:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT 1"))
    yield


app = FastAPI(title="Kycfy Vision API", version="1.0.0", lifespan=lifespan)
origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:8080,http://localhost:5173,http://127.0.0.1:8080,http://127.0.0.1:5173").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])


def log_action(db: Session, user: User, action: str, application_id: str | None = None, status: str = "Info", details: str = "") -> None:
    db.add(AuditLog(user_id=user.id, application_id=application_id, action=action, status=status, details=details[:2000]))


def invalidate_verification(entity: KycApplication) -> None:
    for result in list(entity.verification_results):
        result.is_current = False
    for assessment in list(entity.risk_assessments):
        assessment.is_current = False
    entity.status = "Pending"
    entity.risk_level = "Low"
    entity.risk_score = 0
    entity.ai_action = "Manual Review"
    entity.ai_recommendation = "Application data changed. Run verification again before making a decision."
    entity.workflow_step = max(entity.workflow_step, 2)


def owned_application(db: Session, user: User, application_id: str) -> KycApplication:
    statement = select(KycApplication).options(joinedload(KycApplication.applicant), joinedload(KycApplication.documents)).where(KycApplication.id == application_id, KycApplication.owner_id == user.id)
    entity = db.execute(statement).unique().scalar_one_or_none()
    if entity is None:
        raise HTTPException(status_code=404, detail="Application not found.")
    return entity


def serialize_application(entity: KycApplication) -> dict:
    applicant = entity.applicant
    latest = max((result for result in entity.verification_results if result.is_current), key=lambda result: datetime_sort_key(result.created_at), default=None)
    checks = json.loads(latest.checks_json) if latest else []
    return {
        "id": entity.id, "name": applicant.name,
        "date": entity.created_at.date().isoformat(), "status": entity.status,
        "risk": entity.risk_level, "email": applicant.email, "phone": applicant.phone,
        "dob": applicant.dob, "gender": applicant.gender, "address": applicant.address,
        "aadhaar": applicant.aadhaar, "pan": applicant.pan,
        "riskScore": entity.risk_score, "aiAction": entity.ai_action,
        "aiRecommendation": entity.ai_recommendation, "workflowStep": entity.workflow_step,
        "documents": [{"id": doc.id, "type": doc.document_type, "fileName": doc.original_name,
                       "size": format_size(doc.size_bytes), "status": doc.status,
                       "contentType": doc.content_type, "createdAt": doc.created_at.isoformat()}
                      for doc in sorted(entity.documents, key=lambda item: item.created_at)],
        "checks": checks,
    }


def format_size(size: int) -> str:
    return f"{size / (1024 * 1024):.1f} MB" if size >= 1024 * 1024 else f"{size / 1024:.0f} KB"


def get_text_fields(text: str) -> dict[str, str]:
    patterns = {
        "name": r"(?:name|姓名)\s*[:\-]?\s*([A-Za-z][A-Za-z .'-]{2,100})",
        "dob": r"(?:date of birth|dob|birth)\s*[:\-]?\s*(\d{1,4}[/-]\d{1,2}[/-]\d{1,4})",
        "pan": r"\b([A-Z]{5}\d{4}[A-Z])\b",
        "aadhaar": r"\b(\d{4}[ -]?\d{4}[ -]?\d{4})\b",
    }
    fields = {}
    for field, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            fields[field] = " ".join(match.group(1).strip().split())
    return fields


def compare_values(expected: str, observed: str | None) -> tuple[int, str]:
    if not observed:
        return 0, "Review"
    normalize = lambda value: re.sub(r"[^a-z0-9]", "", value.casefold())
    left, right = normalize(expected), normalize(observed)
    if not left or not right:
        return 0, "Review"
    if left == right:
        return 100, "Pass"
    if left in right or right in left:
        return 75, "Review"
    return 0, "Fail"


def application_checks(entity: KycApplication) -> tuple[list[dict], list[dict], list[str]]:
    extracted: dict[str, str] = {}
    for document in entity.documents:
        try:
            extracted.update(json.loads(document.extracted_fields))
        except json.JSONDecodeError:
            pass
    applicant = entity.applicant
    comparisons = []
    scores = []
    for label, field, entered in [
        ("Full Name", "name", applicant.name), ("Date of Birth", "dob", applicant.dob),
        ("Aadhaar Number", "aadhaar", applicant.aadhaar), ("PAN", "pan", applicant.pan),
    ]:
        score, status = compare_values(entered, extracted.get(field))
        scores.append(score)
        comparisons.append({"field": label, "document": extracted.get(field, "Not extracted"), "entered": entered or "Not provided", "score": score, "status": status})
    available_documents = [doc for doc in entity.documents if doc.status == "Extracted"]
    document_score = 100 if available_documents else 0
    identity_scores = [score for score in scores if score > 0]
    identity_score = round(sum(scores) / len(scores)) if scores else 0
    checks = [
        {"label": "Name Match", "score": scores[0], "status": comparisons[0]["status"]},
        {"label": "Date of Birth Match", "score": scores[1], "status": comparisons[1]["status"]},
        {"label": "Document Text Extraction", "score": document_score, "status": "Pass" if document_score else "Review"},
        {"label": "Identity Match Score", "score": identity_score, "status": "Pass" if identity_score >= 85 else "Review" if identity_score >= 60 else "Fail" if identity_score else "Review"},
    ]
    reasons = []
    if not entity.documents:
        reasons.append("Upload at least one identity document before verification.")
    if not available_documents and entity.documents:
        reasons.append("No readable text was extracted. Image-only documents require a configured OCR engine and manual review.")
    reasons.extend(f"{item['field']} {item['status'].lower()}: extracted value {item['document']}." for item in comparisons if item["status"] != "Pass")
    if any(doc.status == "Rejected" for doc in entity.documents):
        reasons.append("At least one document failed file or content validation.")
    return checks, comparisons, reasons


def apply_decision(entity: KycApplication, checks: list[dict], reasons: list[str]) -> tuple[int, str, str, str]:
    scores = [item["score"] for item in checks if item["score"] > 0]
    match_score = round(sum(scores) / len(scores)) if scores else 0
    risk_score = min(100, (100 - match_score) + (35 if any(item["status"] == "Fail" for item in checks) else 0) + (20 if any(item["status"] == "Review" for item in checks) else 0) + (20 if not entity.documents else 0))
    level = "Low" if risk_score < 30 else "Medium" if risk_score < 70 else "High"
    if not entity.documents or any(item["status"] == "Review" for item in checks):
        status, action = "Under Review", "Manual Review"
    elif any(item["status"] == "Fail" for item in checks) or risk_score >= 70:
        status, action = "Rejected", "Reject"
    elif match_score >= 85 and risk_score < 30:
        status, action = "Verified", "Auto-Approve"
    else:
        status, action = "Under Review", "Manual Review"
    recommendation = " ".join(reasons) if reasons else ("All configured comparison rules passed. A reviewer should make the final approval decision." if status == "Verified" else "Review the flagged identity fields before making a decision.")
    return risk_score, level, status, f"{action}: {recommendation}"


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "kycfy-vision-api"}


@app.post("/api/auth/register", status_code=201)
def register(payload: AuthInput, db: Session = Depends(get_db)):
    email = str(payload.email).strip().lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()
    log_action(db, user, "Account registered", status="Success")
    db.commit()
    return auth_response(user)


@app.post("/api/auth/login")
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    log_action(db, user, "Signed in", status="Success")
    db.commit()
    return auth_response(user)


def auth_response(user: User) -> dict:
    return {"token": issue_token(user.id), "user": {"id": user.id, "name": user.name, "email": user.email}}


@app.get("/api/auth/me")
def me(user: User = Depends(current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(current_user)):
    apps = list(db.execute(select(KycApplication).options(joinedload(KycApplication.applicant), joinedload(KycApplication.documents)).where(KycApplication.owner_id == user.id).order_by(KycApplication.created_at.desc()).limit(6)).unique().scalars())
    counts = dict(db.execute(select(KycApplication.status, func.count()).where(KycApplication.owner_id == user.id).group_by(KycApplication.status)).all())
    total = sum(counts.values())
    daily = db.execute(select(func.date(KycApplication.created_at), func.count()).where(KycApplication.owner_id == user.id, KycApplication.created_at >= datetime.now(timezone.utc) - timedelta(days=6)).group_by(func.date(KycApplication.created_at))).all()
    by_day = {day: count for day, count in daily}
    volume = [{"day": day.strftime("%a"), "count": by_day.get(day.isoformat(), 0)} for day in (datetime.now(timezone.utc).date() - timedelta(days=6-i) for i in range(7))]
    verified = counts.get("Verified", 0)
    return {"counts": {"total": total, "verified": verified, "pending": counts.get("Pending", 0) + counts.get("Under Review", 0), "rejected": counts.get("Rejected", 0), "underReview": counts.get("Under Review", 0)}, "verificationRate": round(verified * 100 / total, 1) if total else 0, "statusCounts": counts, "weeklyVolume": volume, "recent": [serialize_application(item) for item in apps]}


@app.get("/api/applications")
def list_applications(q: str = Query(default="", max_length=160), status: str | None = None, risk: str | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    statement = select(KycApplication).options(joinedload(KycApplication.applicant), joinedload(KycApplication.documents), joinedload(KycApplication.verification_results)).where(KycApplication.owner_id == user.id).order_by(KycApplication.created_at.desc())
    if status and status != "All":
        statement = statement.where(KycApplication.status == status)
    if risk and risk != "All":
        statement = statement.where(KycApplication.risk_level == risk)
    records = list(db.execute(statement).unique().scalars())
    needle = q.casefold().strip()
    if needle:
        records = [record for record in records if needle in record.id.casefold() or needle in record.applicant.name.casefold()]
    return [serialize_application(record) for record in records]


@app.post("/api/applications", status_code=201)
def create_application(payload: ApplicantInput, db: Session = Depends(get_db), user: User = Depends(current_user)):
    applicant = Applicant(**payload.model_dump(exclude={"email"}), email=str(payload.email or "").strip().lower())
    entity = KycApplication(id=f"KYC-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(3).upper()}", owner_id=user.id, applicant=applicant)
    db.add(entity)
    log_action(db, user, "Application created", entity.id, "Success", f"Applicant: {applicant.name}")
    db.commit()
    return serialize_application(owned_application(db, user, entity.id))


@app.get("/api/applications/{application_id}")
def get_application(application_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return serialize_application(owned_application(db, user, application_id))


@app.patch("/api/applications/{application_id}")
def update_application(application_id: str, payload: ApplicantInput, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entity = owned_application(db, user, application_id)
    invalidate_verification(entity)
    for key, value in payload.model_dump().items():
        setattr(entity.applicant, key, str(value or "").strip())
    entity.updated_at = datetime.now(timezone.utc)
    log_action(db, user, "Applicant information updated", entity.id, "Success")
    db.commit()
    return serialize_application(owned_application(db, user, application_id))


@app.patch("/api/applications/{application_id}/status")
def update_status(application_id: str, payload: StatusInput, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entity = owned_application(db, user, application_id)
    if payload.status == "Verified" and (not any(result.is_current for result in entity.verification_results) or entity.risk_score >= 70):
        raise HTTPException(status_code=409, detail="Run verification and resolve high-risk findings before approving this application.")
    entity.status = payload.status
    log_action(db, user, f"Application status changed to {payload.status}", entity.id, "Success" if payload.status == "Verified" else "Warning")
    db.commit()
    return serialize_application(owned_application(db, user, application_id))


@app.delete("/api/applications/{application_id}", status_code=204)
def delete_application(application_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entity = owned_application(db, user, application_id)
    if entity.status != "Pending" or entity.documents:
        raise HTTPException(status_code=409, detail="Only pending applications with no uploaded documents may be deleted.")
    log_action(db, user, "Pending application deleted", None, "Warning", f"Application {entity.id} deleted by its owner")
    db.delete(entity)
    db.commit()


@app.get("/api/documents")
def list_documents(application_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    statement = select(Document).join(KycApplication).where(KycApplication.owner_id == user.id).order_by(Document.created_at.desc())
    if application_id:
        statement = statement.where(Document.application_id == application_id)
    return [{"id": doc.id, "applicationId": doc.application_id, "type": doc.document_type, "fileName": doc.original_name, "size": format_size(doc.size_bytes), "sizeBytes": doc.size_bytes, "contentType": doc.content_type, "status": doc.status, "createdAt": doc.created_at.isoformat(), "extractedFields": json.loads(doc.extracted_fields)} for doc in db.scalars(statement)]


@app.post("/api/applications/{application_id}/documents", status_code=201)
async def upload_document(application_id: str, document_type: str = Query(min_length=2, max_length=60), file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(current_user)):
    entity = owned_application(db, user, application_id)
    invalidate_verification(entity)
    content_type = (file.content_type or "").lower()
    extension = Path(file.filename or "").suffix.lower()
    if content_type not in ALLOWED_TYPES or extension != ALLOWED_TYPES[content_type]:
        raise HTTPException(status_code=415, detail="Upload a PDF, JPEG, or PNG file with a matching extension.")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB upload limit.")
    signature_ok = data.startswith(b"%PDF-") if content_type == "application/pdf" else data.startswith(b"\xff\xd8\xff") if content_type == "image/jpeg" else data.startswith(b"\x89PNG\r\n\x1a\n")
    if not signature_ok:
        raise HTTPException(status_code=415, detail="File contents do not match the declared file type.")
    digest = hashlib.sha256(data).hexdigest()
    if db.scalar(select(Document).where(Document.application_id == entity.id, Document.sha256 == digest)):
        raise HTTPException(status_code=409, detail="This document has already been uploaded to the application.")
    stored_name = storage.save(data, extension)
    extracted_text = ""
    fields = {}
    status = "Manual Review"
    if content_type == "application/pdf":
        try:
            from pypdf import PdfReader
            import io
            extracted_text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages).strip()
            if not extracted_text:
                extracted_text = extract_text_with_ocr(data, content_type)
            if extracted_text:
                fields = get_text_fields(extracted_text)
                status = "Extracted"
        except Exception:
            status = "Manual Review"
    elif content_type in ("image/jpeg", "image/png"):
        try:
            extracted_text = extract_text_with_ocr(data, content_type)
            if extracted_text:
                fields = get_text_fields(extracted_text)
                status = "Extracted"
        except Exception:
            status = "Manual Review"
    document = Document(application_id=entity.id, document_type=document_type, original_name=Path(file.filename or "document").name[:255], stored_name=stored_name, content_type=content_type, size_bytes=len(data), sha256=digest, status=status, extracted_text=extracted_text[:100000], extracted_fields=json.dumps(fields))
    db.add(document)
    entity.workflow_step = max(entity.workflow_step, 1)
    log_action(db, user, "Document uploaded", entity.id, "Success", f"{document.document_type}: {document.original_name}; {status}")
    db.commit()
    return {"id": document.id, "applicationId": entity.id, "type": document.document_type, "fileName": document.original_name, "size": format_size(document.size_bytes), "sizeBytes": document.size_bytes, "contentType": document.content_type, "status": document.status, "createdAt": document.created_at.isoformat(), "extractedFields": fields}


@app.get("/api/documents/{document_id}/content")
def document_content(document_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    document = db.scalar(select(Document).join(KycApplication).where(Document.id == document_id, KycApplication.owner_id == user.id))
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    path = storage.resolve(document.stored_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Stored document is unavailable.")
    return FileResponse(path, media_type=document.content_type, filename=document.original_name, content_disposition_type="inline")


@app.post("/api/applications/{application_id}/verify")
def verify_application(application_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entity = owned_application(db, user, application_id)
    checks, comparisons, reasons = application_checks(entity)
    risk_score, level, status, recommendation = apply_decision(entity, checks, reasons)
    entity.risk_score, entity.risk_level, entity.status = risk_score, level, status
    entity.ai_action, entity.ai_recommendation, entity.workflow_step = recommendation.split(":", 1)[0], recommendation.split(":", 1)[1].strip(), 4
    result = VerificationResult(application_id=entity.id, score=round(sum(item["score"] for item in checks) / len(checks)), status=status, checks_json=json.dumps(checks), comparisons_json=json.dumps(comparisons), reasons="\n".join(reasons))
    assessment = RiskAssessment(application_id=entity.id, score=risk_score, level=level, factors=json.dumps(reasons or ["No configured risk factors triggered."]))
    db.add_all([result, assessment])
    log_action(db, user, "Verification completed", entity.id, "Success" if status == "Verified" else "Warning", f"Risk {risk_score}/100 ({level}); {status}")
    db.commit()
    return {"application": serialize_application(owned_application(db, user, application_id)), "score": result.score, "comparisons": comparisons, "reasons": reasons, "riskFactors": json.loads(assessment.factors)}


@app.get("/api/applications/{application_id}/verification")
def verification_result(application_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entity = owned_application(db, user, application_id)
    result = max((item for item in entity.verification_results if item.is_current), key=lambda item: datetime_sort_key(item.created_at), default=None)
    checks, comparisons, reasons = application_checks(entity)
    return {"applicationId": entity.id, "status": entity.status, "score": result.score if result else 0, "checks": json.loads(result.checks_json) if result else checks, "comparisons": json.loads(result.comparisons_json) if result else comparisons, "reasons": result.reasons.splitlines() if result else reasons, "riskScore": entity.risk_score, "riskLevel": entity.risk_level}


@app.post("/api/applications/{application_id}/submissions", status_code=201)
def submit_demo(application_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    entity = owned_application(db, user, application_id)
    if entity.status != "Verified":
        raise HTTPException(status_code=409, detail="Only verified applications can be submitted.")
    payload = {"applicationId": entity.id, "applicant": {"name": entity.applicant.name, "email": entity.applicant.email, "phone": entity.applicant.phone, "dob": entity.applicant.dob, "address": entity.applicant.address}, "documents": [{"type": doc.document_type, "fileName": doc.original_name, "sha256": doc.sha256} for doc in entity.documents], "mode": "demo"}
    reference = f"DEMO-{secrets.token_hex(5).upper()}"
    response = {"mode": "demo", "message": "Payload validated and stored locally. No external portal was contacted.", "reference": reference}
    submission = PortalSubmissionRecord(application_id=entity.id, mode="demo", status="Stored", payload_json=json.dumps(payload), response_json=json.dumps(response), reference=reference)
    db.add(submission)
    log_action(db, user, "Demo portal submission recorded", entity.id, "Success", reference)
    db.commit()
    return {"id": submission.id, "applicationId": entity.id, "mode": "demo", "status": "Stored", "payload": payload, "response": response, "reference": reference, "createdAt": submission.created_at.isoformat()}


@app.get("/api/applications/{application_id}/submissions")
def list_submissions(application_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    owned_application(db, user, application_id)
    records = db.scalars(select(PortalSubmissionRecord).where(PortalSubmissionRecord.application_id == application_id).order_by(PortalSubmissionRecord.created_at.desc()))
    return [{"id": row.id, "applicationId": row.application_id, "mode": row.mode, "status": row.status, "payload": json.loads(row.payload_json), "response": json.loads(row.response_json), "reference": row.reference, "createdAt": row.created_at.isoformat()} for row in records]


@app.get("/api/audit-logs")
def audit_logs(q: str = Query(default="", max_length=160), status: str | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    statement = select(AuditLog).where(AuditLog.user_id == user.id).order_by(AuditLog.created_at.desc())
    records = list(db.scalars(statement))
    needle = q.casefold().strip()
    if needle:
        records = [row for row in records if needle in row.action.casefold() or needle in (row.application_id or "").casefold() or needle in row.details.casefold()]
    if status and status != "All":
        records = [row for row in records if row.status == status]
    return [{"id": row.id, "timestamp": row.created_at.isoformat(), "action": row.action, "applicationId": row.application_id, "user": row.user.name if row.user else "System", "status": row.status, "details": row.details} for row in records]


def extract_text_with_ocr(content: bytes, content_type: str) -> str:
    """Extract text from JPEG/PNG images or scanned PDF pages using Tesseract."""
    import io

    import pytesseract
    from PIL import Image, ImageEnhance, ImageOps

    def ocr_image(image: Image.Image) -> str:
        prepared = ImageOps.exif_transpose(image).convert("RGB")
        prepared = ImageOps.grayscale(prepared)
        prepared = ImageEnhance.Contrast(prepared).enhance(1.5)
        prepared = prepared.resize(
            (prepared.width * 2, prepared.height * 2),
            resample=Image.Resampling.LANCZOS,
        )
        return pytesseract.image_to_string(prepared, lang="eng", config="--psm 6")

    if content_type == "application/pdf":
        from pdf2image import convert_from_bytes

        pages = convert_from_bytes(content, dpi=300)
        return "\n".join(ocr_image(page) for page in pages).strip()

    with Image.open(io.BytesIO(content)) as image:
        return ocr_image(image).strip()


def datetime_sort_key(value: datetime) -> datetime:
    """Normalize SQLite-naive and timezone-aware datetimes for safe comparisons."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
