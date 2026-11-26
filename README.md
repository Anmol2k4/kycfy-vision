# KYCFlow Dashboard

Build a minimal frontend-only dashboard for an AI-powered KYC Automation System called KYCFlow AI.

This is a college SGP project, so focus ONLY on the frontend. Do not create a backend, database, authentication system, APIs, real OCR, or real AI integrations.

Use React + Tailwind CSS.

Create a clean professional fintech/enterprise dashboard with a left sidebar containing:

Dashboard

KYC Applications

Documents

Verification

Portal Submission

Audit Logs

Create these main screens:

Dashboard

Total Applications

Pending Verification

Verified

Rejected

Recent KYC Applications table

Simple verification status chart

KYC Applications

Table with Application ID, Applicant Name, Date, Status, Risk Level

Search bar

Status filter

Clicking an application opens its details

KYC Application Details

Applicant information

Uploaded documents

Verification status

Risk score

AI recommendation

Workflow showing:
Upload → Extract → Validate → Verify → Decision

Documents

Drag-and-drop upload UI

Aadhaar, PAN, Passport and Driving Licence cards

Uploaded/Processing/Verified status

Simulate processing using frontend state

Verification

Name match

Date of birth match

Document validity

Identity match score

Overall verification score

Verified / Requires Review status

Portal Submission

Show a simple automation workflow:
Authenticate → Enter Data → Upload Documents → Submit → Confirmation

Add a "Start Submission" button that simulates progress using frontend state.

Audit Logs

Simple table showing timestamp, action, application ID and status.

Use realistic mock data so the dashboard looks populated.

Keep the design minimal, polished, responsive and professional. Use subtle animations, clean cards, tables and status badges.

Do NOT over-engineer the project. The priority is a working, visually impressive frontend prototype that can be demonstrated in a college presentation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0dd15dfd-5015-4aa7-ae87-652c6bc19b66).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
