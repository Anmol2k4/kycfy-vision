# Kycfy Vision — Working Guide

A quick orientation for running, demonstrating, and safely changing this project.

## What the project does

Kycfy Vision is a college-project KYC workflow prototype. The React/TanStack Start frontend is in `src/`; the Python FastAPI backend and SQLAlchemy models are in `backend/app/`. The API stores users, applications, applicant details, documents, verification results, risk assessments, demo submissions, and audit events in SQLite by default. Local uploaded files are stored under `backend/data/uploads/`.

Current document processing extracts text from text-based PDFs with `pypdf`, then applies simple field patterns and comparison/risk rules. It does not currently OCR image files, verify document authenticity, query government/watchlist services, or submit to a real portal. The portal flow is explicitly a local demo.

## Run it on Windows

Open two terminals. In both, start from the project folder:

```powershell
cd C:\Users\user\Downloads\kycfy-vision-main\kycfy-vision-main
```

Terminal 1 — frontend:

```powershell
npm install
npm run dev
```

Terminal 2 — backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks virtual-environment activation, either adjust the policy for the current terminal according to your institution’s guidance, or invoke `backend\.venv\Scripts\python.exe` directly for pip and Uvicorn commands.

Open the frontend address printed by Vite (normally <http://localhost:8080>). The backend health endpoint is <http://127.0.0.1:8000/api/health>, and interactive API documentation is <http://127.0.0.1:8000/docs>. Stop each server with **Ctrl+C** in its terminal.

## First demo walkthrough

1. Open the frontend and select **Create an account**. Use a test email and a strong password; do not use real applicant data.
2. Create an application and enter applicant details.
3. Upload a permitted PDF, JPEG, or PNG. Text extraction currently works only when the PDF contains selectable text; image/scanned files go to manual review.
4. Open Verification and run the checks. Read the per-field results and risk reasons; the score is a prototype heuristic, not a probability or final identity decision.
5. Review the application status and available actions. A demo portal submission is a local database record, not an external submission.
6. Open Audit Logs to see recorded account and application actions.

The default database is created at first API startup. Its path is relative to the backend working directory: `backend/data/kycfy.db`. Uploaded files go in `backend/data/uploads/`. Keep these local development files private and out of source control.

## Where to make changes

| If you want to change… | Start here |
| --- | --- |
| Dashboard, applications, documents, verification, submission, or audit page | `src/routes/` |
| Shared API requests and bearer-token handling | `src/lib/api.ts` |
| Shared navigation/layout | `src/components/AppShell.tsx` |
| API routes and workflow rules | `backend/app/main.py` |
| Database tables and relationships | `backend/app/models.py` |
| Request validation | `backend/app/schemas.py` |
| Database URL/session configuration | `backend/app/database.py` |
| Password hashing and token validation | `backend/app/security.py` |
| Local document storage | `backend/app/storage.py` |
| Python dependencies | `backend/requirements.txt` |
| Project setup and fuller configuration notes | `README.md` |

Useful commands from the project root:

```powershell
npm run build
npm run lint
```

There is currently no configured automated test suite. Before presenting, build the frontend, start the backend, confirm `/api/health`, then manually exercise account creation, application creation, upload, verification, demo submission (if eligible), and audit history.

## Environment and safety reminders

The API reads `backend/.env`; begin with `backend/.env.example`. The main settings are `APP_SECRET_KEY`, `DATABASE_URL`, `UPLOAD_DIR`, `FRONTEND_ORIGINS`, `MAX_UPLOAD_MB`, and `TOKEN_TTL_HOURS`. The frontend optionally reads `VITE_API_BASE_URL` at build/dev startup and defaults to `http://localhost:8000`. Replace the development signing secret before sharing the project. Never commit `.env`, credentials, real IDs, or uploaded identity documents.

This is a demonstration system, not production KYC software. It has no OCR engine, real portal credentials, external identity validation, role-based authorization, MFA, malware scanning, or production document-retention controls. Do not use its recommendation to approve or reject real people.
