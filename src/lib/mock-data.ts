export type KycStatus = "Verified" | "Pending" | "Rejected" | "Under Review";
export type RiskLevel = "Low" | "Medium" | "High";
export type DocStatus = "Uploaded" | "Processing" | "Verified";
export type AiAction = "Auto-Approve" | "Manual Review" | "Reject";

export interface KycDocument {
  type: string;
  fileName: string;
  size: string;
  status: DocStatus;
}

export interface VerificationCheck {
  label: string;
  score: number;
  status: "Pass" | "Review" | "Fail";
}

export interface Application {
  id: string;
  name: string;
  date: string;
  status: KycStatus;
  risk: RiskLevel;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  aadhaar: string;
  pan: string;
  riskScore: number;
  aiAction: AiAction;
  aiRecommendation: string;
  /** Index into WORKFLOW_STAGES that the application has reached (0-4). */
  workflowStep: number;
  documents: KycDocument[];
  checks: VerificationCheck[];
}

export const WORKFLOW_STAGES = [
  "Upload",
  "Extract",
  "Validate",
  "Verify",
  "Decision",
] as const;

export const applications: Application[] = [
  {
    id: "KYC-2026-1042",
    name: "Aarav Sharma",
    date: "2026-08-21",
    status: "Verified",
    risk: "Low",
    email: "aarav.sharma@gmail.com",
    phone: "+91 98301 24567",
    dob: "1994-03-12",
    gender: "Male",
    address: "22/B Lake Gardens, Kolkata, West Bengal 700045",
    aadhaar: "XXXX XXXX 4821",
    pan: "BXTPS4521K",
    riskScore: 12,
    aiAction: "Auto-Approve",
    aiRecommendation:
      "All identity attributes match across documents with high confidence. Document authenticity signals are strong and no watchlist hits were found. Recommend auto-approval.",
    workflowStep: 4,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_front.pdf", size: "1.2 MB", status: "Verified" },
      { type: "PAN Card", fileName: "pan_card.jpg", size: "840 KB", status: "Verified" },
    ],
    checks: [
      { label: "Name Match", score: 99, status: "Pass" },
      { label: "Date of Birth Match", score: 100, status: "Pass" },
      { label: "Document Validity", score: 97, status: "Pass" },
      { label: "Identity Match Score", score: 96, status: "Pass" },
    ],
  },
  {
    id: "KYC-2026-1041",
    name: "Priya Patel",
    date: "2026-08-21",
    status: "Pending",
    risk: "Medium",
    email: "priya.patel@outlook.com",
    phone: "+91 90045 81123",
    dob: "1998-11-02",
    gender: "Female",
    address: "404 Silver Heights, Andheri West, Mumbai 400053",
    aadhaar: "XXXX XXXX 9034",
    pan: "CQMPP9034A",
    riskScore: 46,
    aiAction: "Manual Review",
    aiRecommendation:
      "Name on PAN card shows a minor spelling variance versus Aadhaar (Patel / Patil). Recommend manual review of the surname field before proceeding.",
    workflowStep: 3,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_priya.pdf", size: "1.1 MB", status: "Verified" },
      { type: "PAN Card", fileName: "pan_scan.png", size: "620 KB", status: "Processing" },
      { type: "Passport", fileName: "passport.pdf", size: "2.4 MB", status: "Uploaded" },
    ],
    checks: [
      { label: "Name Match", score: 82, status: "Review" },
      { label: "Date of Birth Match", score: 100, status: "Pass" },
      { label: "Document Validity", score: 91, status: "Pass" },
      { label: "Identity Match Score", score: 84, status: "Review" },
    ],
  },
  {
    id: "KYC-2026-1040",
    name: "Rahul Verma",
    date: "2026-08-20",
    status: "Verified",
    risk: "Low",
    email: "rahul.verma@yahoo.in",
    phone: "+91 98110 33445",
    dob: "1990-06-25",
    gender: "Male",
    address: "C-56 Defence Colony, New Delhi 110024",
    aadhaar: "XXXX XXXX 2210",
    pan: "AFRPV2210M",
    riskScore: 9,
    aiAction: "Auto-Approve",
    aiRecommendation:
      "Complete cross-document consistency and clean address history. Liveness and ID portrait match scored 98%. Recommend auto-approval.",
    workflowStep: 4,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_rv.pdf", size: "980 KB", status: "Verified" },
      { type: "Driving Licence", fileName: "dl_verma.jpg", size: "1.3 MB", status: "Verified" },
    ],
    checks: [
      { label: "Name Match", score: 100, status: "Pass" },
      { label: "Date of Birth Match", score: 100, status: "Pass" },
      { label: "Document Validity", score: 98, status: "Pass" },
      { label: "Identity Match Score", score: 98, status: "Pass" },
    ],
  },
  {
    id: "KYC-2026-1039",
    name: "Sneha Iyer",
    date: "2026-08-20",
    status: "Rejected",
    risk: "High",
    email: "sneha.iyer@gmail.com",
    phone: "+91 98840 76219",
    dob: "1996-01-18",
    gender: "Female",
    address: "17 Besant Nagar Beach Road, Chennai 600090",
    aadhaar: "XXXX XXXX 6642",
    pan: "DHWPI6642R",
    riskScore: 88,
    aiAction: "Reject",
    aiRecommendation:
      "Uploaded PAN document failed authenticity checks — inconsistent font metrics and missing hologram texture. Possible tampered document. Recommend rejection and re-request.",
    workflowStep: 4,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_sneha.pdf", size: "1.0 MB", status: "Verified" },
      { type: "PAN Card", fileName: "pan_edited.png", size: "540 KB", status: "Uploaded" },
    ],
    checks: [
      { label: "Name Match", score: 94, status: "Pass" },
      { label: "Date of Birth Match", score: 61, status: "Fail" },
      { label: "Document Validity", score: 34, status: "Fail" },
      { label: "Identity Match Score", score: 58, status: "Fail" },
    ],
  },
  {
    id: "KYC-2026-1038",
    name: "Arjun Mehta",
    date: "2026-08-19",
    status: "Pending",
    risk: "Medium",
    email: "arjun.mehta@icloud.com",
    phone: "+91 98200 14896",
    dob: "2001-09-07",
    gender: "Male",
    address: "9 Palm Spring Plaza, Sector 53, Gurugram 122002",
    aadhaar: "XXXX XXXX 1187",
    pan: "GKPPM1187T",
    riskScore: 52,
    aiAction: "Manual Review",
    aiRecommendation:
      "Address on Aadhaar differs from the declared residential address. Document quality is acceptable. Recommend requesting a supporting address proof.",
    workflowStep: 2,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_arjun.pdf", size: "1.4 MB", status: "Processing" },
      { type: "PAN Card", fileName: "pan_arjun.jpg", size: "760 KB", status: "Uploaded" },
    ],
    checks: [
      { label: "Name Match", score: 97, status: "Pass" },
      { label: "Date of Birth Match", score: 100, status: "Pass" },
      { label: "Document Validity", score: 78, status: "Review" },
      { label: "Identity Match Score", score: 81, status: "Review" },
    ],
  },
  {
    id: "KYC-2026-1037",
    name: "Kavya Reddy",
    date: "2026-08-19",
    status: "Verified",
    risk: "Low",
    email: "kavya.reddy@gmail.com",
    phone: "+91 99491 50238",
    dob: "1993-04-30",
    gender: "Female",
    address: "8-2-293 Road No. 12, Banjara Hills, Hyderabad 500034",
    aadhaar: "XXXX XXXX 7453",
    pan: "BNKPR7453L",
    riskScore: 14,
    aiAction: "Auto-Approve",
    aiRecommendation:
      "All checks passed with high confidence. Passport and Aadhaar attributes are fully consistent. Recommend auto-approval.",
    workflowStep: 4,
    documents: [
      { type: "Passport", fileName: "passport_kavya.pdf", size: "2.1 MB", status: "Verified" },
      { type: "Aadhaar Card", fileName: "aadhaar_kr.pdf", size: "1.1 MB", status: "Verified" },
    ],
    checks: [
      { label: "Name Match", score: 100, status: "Pass" },
      { label: "Date of Birth Match", score: 99, status: "Pass" },
      { label: "Document Validity", score: 96, status: "Pass" },
      { label: "Identity Match Score", score: 97, status: "Pass" },
    ],
  },
  {
    id: "KYC-2026-1036",
    name: "Vikram Singh",
    date: "2026-08-18",
    status: "Under Review",
    risk: "High",
    email: "vikram.singh@rediffmail.com",
    phone: "+91 94150 66712",
    dob: "1987-12-14",
    gender: "Male",
    address: "H.No. 431 Gomti Nagar, Lucknow 226010",
    aadhaar: "XXXX XXXX 3308",
    pan: "JTPPS3308W",
    riskScore: 74,
    aiAction: "Manual Review",
    aiRecommendation:
      "Device fingerprint is associated with two previously rejected applications and the selfie liveness score is borderline (71%). Recommend enhanced due diligence.",
    workflowStep: 3,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_vs.pdf", size: "1.2 MB", status: "Verified" },
      { type: "PAN Card", fileName: "pan_vs.jpg", size: "690 KB", status: "Verified" },
      { type: "Driving Licence", fileName: "dl_vs.pdf", size: "1.5 MB", status: "Processing" },
    ],
    checks: [
      { label: "Name Match", score: 90, status: "Pass" },
      { label: "Date of Birth Match", score: 88, status: "Pass" },
      { label: "Document Validity", score: 72, status: "Review" },
      { label: "Identity Match Score", score: 64, status: "Review" },
    ],
  },
  {
    id: "KYC-2026-1035",
    name: "Ananya Das",
    date: "2026-08-18",
    status: "Verified",
    risk: "Low",
    email: "ananya.das@gmail.com",
    phone: "+91 98367 20984",
    dob: "1999-08-09",
    gender: "Female",
    address: "35A Southern Avenue, Kolkata, West Bengal 700029",
    aadhaar: "XXXX XXXX 5516",
    pan: "LQMPD5516N",
    riskScore: 11,
    aiAction: "Auto-Approve",
    aiRecommendation:
      "Document extraction confidence above 98% on all fields. No anomalies detected. Recommend auto-approval.",
    workflowStep: 4,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_ananya.pdf", size: "1.0 MB", status: "Verified" },
      { type: "PAN Card", fileName: "pan_ananya.jpg", size: "720 KB", status: "Verified" },
    ],
    checks: [
      { label: "Name Match", score: 100, status: "Pass" },
      { label: "Date of Birth Match", score: 100, status: "Pass" },
      { label: "Document Validity", score: 99, status: "Pass" },
      { label: "Identity Match Score", score: 95, status: "Pass" },
    ],
  },
  {
    id: "KYC-2026-1034",
    name: "Rohan Kapoor",
    date: "2026-08-17",
    status: "Pending",
    risk: "Low",
    email: "rohan.kapoor@gmail.com",
    phone: "+91 98731 45520",
    dob: "1995-02-21",
    gender: "Male",
    address: "B-1204 Lodha Splendora, Thane West 400615",
    aadhaar: "XXXX XXXX 8874",
    pan: "MXPPK8874D",
    riskScore: 24,
    aiAction: "Manual Review",
    aiRecommendation:
      "All fields extracted successfully. Awaiting document validation to complete before a final recommendation can be issued.",
    workflowStep: 1,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_rohan.pdf", size: "1.3 MB", status: "Uploaded" },
    ],
    checks: [
      { label: "Name Match", score: 96, status: "Pass" },
      { label: "Date of Birth Match", score: 98, status: "Pass" },
      { label: "Document Validity", score: 0, status: "Review" },
      { label: "Identity Match Score", score: 0, status: "Review" },
    ],
  },
  {
    id: "KYC-2026-1033",
    name: "Ishita Nair",
    date: "2026-08-17",
    status: "Verified",
    risk: "Medium",
    email: "ishita.nair@gmail.com",
    phone: "+91 98470 31266",
    dob: "1992-07-05",
    gender: "Female",
    address: "TC 14/2107 Kowdiar, Thiruvananthapuram 695003",
    aadhaar: "XXXX XXXX 2091",
    pan: "PNVPN2091H",
    riskScore: 38,
    aiAction: "Auto-Approve",
    aiRecommendation:
      "Verification passed. Medium risk band driven only by a recent address change; identity evidence itself is fully consistent. Recommend approval.",
    workflowStep: 4,
    documents: [
      { type: "Passport", fileName: "passport_ishita.pdf", size: "2.2 MB", status: "Verified" },
      { type: "PAN Card", fileName: "pan_ishita.jpg", size: "810 KB", status: "Verified" },
    ],
    checks: [
      { label: "Name Match", score: 98, status: "Pass" },
      { label: "Date of Birth Match", score: 100, status: "Pass" },
      { label: "Document Validity", score: 93, status: "Pass" },
      { label: "Identity Match Score", score: 90, status: "Pass" },
    ],
  },
  {
    id: "KYC-2026-1032",
    name: "Aditya Joshi",
    date: "2026-08-16",
    status: "Rejected",
    risk: "High",
    email: "aditya.joshi@gmail.com",
    phone: "+91 98901 77342",
    dob: "1989-10-27",
    gender: "Male",
    address: "7 Prabhat Road, Erandwane, Pune 411004",
    aadhaar: "XXXX XXXX 4720",
    pan: "RWYPJ4720B",
    riskScore: 91,
    aiAction: "Reject",
    aiRecommendation:
      "Identity match score below threshold and the Aadhaar number failed checksum validation. Possible synthetic identity. Recommend rejection.",
    workflowStep: 4,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_aj.pdf", size: "1.1 MB", status: "Uploaded" },
      { type: "PAN Card", fileName: "pan_aj.jpg", size: "660 KB", status: "Uploaded" },
    ],
    checks: [
      { label: "Name Match", score: 72, status: "Review" },
      { label: "Date of Birth Match", score: 55, status: "Fail" },
      { label: "Document Validity", score: 41, status: "Fail" },
      { label: "Identity Match Score", score: 47, status: "Fail" },
    ],
  },
  {
    id: "KYC-2026-1031",
    name: "Meera Kulkarni",
    date: "2026-08-16",
    status: "Verified",
    risk: "Low",
    email: "meera.kulkarni@gmail.com",
    phone: "+91 98811 62037",
    dob: "1997-05-16",
    gender: "Female",
    address: "501 Gulmohar Residency, FC Road, Pune 411005",
    aadhaar: "XXXX XXXX 6319",
    pan: "TXPPK6319Q",
    riskScore: 8,
    aiAction: "Auto-Approve",
    aiRecommendation:
      "Perfect cross-document match with strong authenticity signals on both documents. Recommend auto-approval.",
    workflowStep: 4,
    documents: [
      { type: "Aadhaar Card", fileName: "aadhaar_meera.pdf", size: "1.0 MB", status: "Verified" },
      { type: "Driving Licence", fileName: "dl_meera.pdf", size: "1.4 MB", status: "Verified" },
    ],
    checks: [
      { label: "Name Match", score: 100, status: "Pass" },
      { label: "Date of Birth Match", score: 100, status: "Pass" },
      { label: "Document Validity", score: 99, status: "Pass" },
      { label: "Identity Match Score", score: 99, status: "Pass" },
    ],
  },
];

export function getApplication(id: string): Application | undefined {
  return applications.find((a) => a.id === id);
}

export const statusCounts = {
  total: 1284,
  verified: 1189,
  pending: 56,
  rejected: 39,
};

export const weeklyVolume = [
  { day: "Mon", count: 42 },
  { day: "Tue", count: 58 },
  { day: "Wed", count: 37 },
  { day: "Thu", count: 66 },
  { day: "Fri", count: 49 },
  { day: "Sat", count: 71 },
  { day: "Sun", count: 24 },
];

export interface AuditLog {
  timestamp: string;
  action: string;
  applicationId: string;
  status: "Success" | "Info" | "Warning" | "Failed";
}

export const auditLogs: AuditLog[] = [
  { timestamp: "2026-08-22 08:12:41", action: "Application approved by AI engine", applicationId: "KYC-2026-1042", status: "Success" },
  { timestamp: "2026-08-22 08:09:17", action: "Portal submission acknowledged", applicationId: "KYC-2026-1042", status: "Success" },
  { timestamp: "2026-08-22 07:58:03", action: "OCR extraction completed (3 fields)", applicationId: "KYC-2026-1041", status: "Success" },
  { timestamp: "2026-08-22 07:54:52", action: "Name variance detected — Patel / Patil", applicationId: "KYC-2026-1041", status: "Warning" },
  { timestamp: "2026-08-22 07:41:30", action: "Document uploaded: passport.pdf", applicationId: "KYC-2026-1041", status: "Info" },
  { timestamp: "2026-08-22 07:22:08", action: "Application submitted to portal", applicationId: "KYC-2026-1040", status: "Success" },
  { timestamp: "2026-08-22 07:15:44", action: "Document authenticity check failed", applicationId: "KYC-2026-1039", status: "Failed" },
  { timestamp: "2026-08-22 07:11:19", action: "Application rejected by AI engine", applicationId: "KYC-2026-1039", status: "Failed" },
  { timestamp: "2026-08-22 06:58:37", action: "Risk assessment completed (score 52)", applicationId: "KYC-2026-1038", status: "Info" },
  { timestamp: "2026-08-22 06:47:02", action: "Address mismatch flagged for review", applicationId: "KYC-2026-1038", status: "Warning" },
  { timestamp: "2026-08-22 06:31:55", action: "Liveness check passed (98.2%)", applicationId: "KYC-2026-1037", status: "Success" },
  { timestamp: "2026-08-22 06:20:11", action: "Enhanced due diligence triggered", applicationId: "KYC-2026-1036", status: "Warning" },
  { timestamp: "2026-08-22 06:05:48", action: "New application created", applicationId: "KYC-2026-1034", status: "Info" },
  { timestamp: "2026-08-22 05:52:26", action: "Aadhaar checksum validation failed", applicationId: "KYC-2026-1032", status: "Failed" },
];
