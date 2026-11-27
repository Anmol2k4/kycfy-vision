# Kycfy Vision — KYC Automation System

Kycfy Vision keeps the existing React/TanStack Start dashboard and adds a FastAPI REST backend. The application is a college-project prototype: it performs transparent text comparisons and rule-based risk scoring; it is not a regulated identity-verification service.

## Implementation checklist

- [x] Preserve the existing dashboard, navigation, and visual system.
- [x] Add user registration/sign-in and owner-scoped application/document access.
- [x] Persist applicants, KYC applications, documents, verification results, risk assessments, submissions, and append-only audit events.
- [x] Connect the dashboard, applications, documents, verification, portal-submission, and audit-log screens to the API.
- [x] Add PDF text extraction, explainable field comparisons/risk rules, safe local storage, and a clearly labeled demo portal adapter.
- [ ] Configure a real OCR provider and regulator portal only when suitable credentials/services are available.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm for the existing Vite 8 frontend.
- Python 3.10+ for the API.
- SQLite is used by default. PostgreSQL is supported with a PostgreSQL connection URL and a reachable database.

## Install

From the project root:

```powershell
npm install
```

Install the backend packages:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS/Linux, activate with `source .venv/bin/activate` instead.

## Environment configuration

Copy `backend/.env.example` to `backend/.env`. The API loads that file automatically. At minimum, replace `APP_SECRET_KEY` with a private random value of at least 32 characters. Do not commit `.env` or production credentials.

Settings:

- `DATABASE_URL`: defaults to `sqlite:///./data/kycfy.db` (path is relative to `backend/`). PostgreSQL example: `postgresql://user:password@localhost:5432/kycfy`.
- `UPLOAD_DIR`: defaults to `./data/uploads`, a local private document directory relative to `backend/`.
- `APP_SECRET_KEY`: signs expiring bearer tokens; change it before sharing or deployment.
- `FRONTEND_ORIGINS`: comma-separated browser origins allowed by CORS. Include the actual deployed frontend origin when deploying.
- `MAX_UPLOAD_MB`: maximum upload size (defaults to 10 MB).
- `TOKEN_TTL_HOURS`: bearer-token lifetime (defaults to 12 hours).
- `VITE_API_BASE_URL`: optional frontend build-time API origin; defaults to `http://localhost:8000`.

## Initialize and run

The API initializes its database tables on first startup using SQLAlchemy metadata (`create_all`). SQLite creates `backend/data/kycfy.db`; uploaded files go under `backend/data/uploads`. No separate migration command is required for a fresh local database. `create_all` does not alter existing schemas; use a managed migration tool before evolving a deployed database schema.

Start the backend in one terminal:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend from the project root in a second terminal:

```powershell
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:8080`). Create an account in the sign-in screen. API documentation is available at `http://localhost:8000/docs`; health check: `http://localhost:8000/api/health`.

## What is and is not integrated

- PDF text extraction is local using `pypdf`. If a PDF has no extractable text, or an image is uploaded, the application marks it for manual review. No OCR is performed on images.
- Verification compares fields actually extracted from uploaded PDF text with the submitted applicant fields. Missing values are visible and flagged. Risk levels follow simple documented-in-code rules; they are not an AML/watchlist check or proof of document authenticity.
- The demo portal adapter stores the structured payload and a `DEMO-…` reference in the database. It never contacts a real portal and does not claim an external acknowledgement.
- Local disk storage is behind a small storage adapter and is intended for development only. Use private object storage, malware scanning, encryption/key management, retention controls, and deployment-grade secrets before handling real identity documents.
- Authentication is email/password with scrypt password hashes and signed expiring bearer tokens. Accounts can access only their own KYC records. This prototype does not include password reset, email verification, roles, MFA, or production rate limiting.
