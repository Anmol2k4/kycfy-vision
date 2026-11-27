from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    applications: Mapped[list["KycApplication"]] = relationship(back_populates="owner")


class Applicant(Base):
    __tablename__ = "applicants"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(40), default="")
    dob: Mapped[str] = mapped_column(String(20), default="")
    gender: Mapped[str] = mapped_column(String(40), default="")
    address: Mapped[str] = mapped_column(Text, default="")
    aadhaar: Mapped[str] = mapped_column(String(40), default="")
    pan: Mapped[str] = mapped_column(String(20), default="")
    application: Mapped["KycApplication"] = relationship(back_populates="applicant", uselist=False)


class KycApplication(Base):
    __tablename__ = "kyc_applications"
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    applicant_id: Mapped[int] = mapped_column(ForeignKey("applicants.id"), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="Pending", index=True)
    risk_level: Mapped[str] = mapped_column(String(20), default="Low")
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    ai_action: Mapped[str] = mapped_column(String(30), default="Manual Review")
    ai_recommendation: Mapped[str] = mapped_column(Text, default="Verification has not been run.")
    workflow_step: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    owner: Mapped[User] = relationship(back_populates="applications")
    applicant: Mapped[Applicant] = relationship(back_populates="application", cascade="all, delete-orphan", single_parent=True)
    documents: Mapped[list["Document"]] = relationship(back_populates="application", cascade="all, delete-orphan")
    verification_results: Mapped[list["VerificationResult"]] = relationship(back_populates="application", cascade="all, delete-orphan")
    risk_assessments: Mapped[list["RiskAssessment"]] = relationship(back_populates="application", cascade="all, delete-orphan")
    submissions: Mapped[list["PortalSubmissionRecord"]] = relationship(back_populates="application", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (UniqueConstraint("application_id", "sha256", name="uq_document_application_hash"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("kyc_applications.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(60))
    original_name: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255), unique=True)
    content_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(30), default="Uploaded")
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    extracted_fields: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    application: Mapped[KycApplication] = relationship(back_populates="documents")


class VerificationResult(Base):
    __tablename__ = "verification_results"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("kyc_applications.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30))
    checks_json: Mapped[str] = mapped_column(Text)
    comparisons_json: Mapped[str] = mapped_column(Text)
    reasons: Mapped[str] = mapped_column(Text)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    application: Mapped[KycApplication] = relationship(back_populates="verification_results")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("kyc_applications.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    level: Mapped[str] = mapped_column(String(20))
    factors: Mapped[str] = mapped_column(Text)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    application: Mapped[KycApplication] = relationship(back_populates="risk_assessments")


class PortalSubmissionRecord(Base):
    __tablename__ = "portal_submission_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("kyc_applications.id"), index=True)
    mode: Mapped[str] = mapped_column(String(20), default="demo")
    status: Mapped[str] = mapped_column(String(30))
    payload_json: Mapped[str] = mapped_column(Text)
    response_json: Mapped[str] = mapped_column(Text)
    reference: Mapped[str] = mapped_column(String(60), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    application: Mapped[KycApplication] = relationship(back_populates="submissions")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    # Snapshot ID intentionally is not a foreign key: immutable audit history survives permitted deletion.
    application_id: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(20), default="Info")
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    user: Mapped[User | None] = relationship()
