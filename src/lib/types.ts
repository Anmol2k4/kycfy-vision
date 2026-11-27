export type KycStatus = "Verified" | "Pending" | "Rejected" | "Under Review";
export type RiskLevel = "Low" | "Medium" | "High";
export type AiAction = "Auto-Approve" | "Manual Review" | "Reject";

export interface KycDocument {
  id?: number;
  type: string;
  fileName: string;
  size: string;
  status: string;
  contentType?: string;
  createdAt?: string;
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
  workflowStep: number;
  documents: KycDocument[];
  checks: VerificationCheck[];
}

export const WORKFLOW_STAGES = ["Upload", "Extract", "Validate", "Verify", "Decision"] as const;
