import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Verified: "bg-success-soft text-success",
  Pending: "bg-warning-soft text-warning",
  Rejected: "bg-destructive-soft text-destructive",
  "Under Review": "bg-info-soft text-info",
  Uploaded: "bg-info-soft text-info",
  Processing: "bg-warning-soft text-warning",
  Success: "bg-success-soft text-success",
  Info: "bg-info-soft text-info",
  Warning: "bg-warning-soft text-warning",
  Failed: "bg-destructive-soft text-destructive",
  Pass: "bg-success-soft text-success",
  Review: "bg-warning-soft text-warning",
  Fail: "bg-destructive-soft text-destructive",
  "Requires Review": "bg-warning-soft text-warning",
};

const RISK_STYLES: Record<string, string> = {
  Low: "bg-success-soft text-success",
  Medium: "bg-warning-soft text-warning",
  High: "bg-destructive-soft text-destructive",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function RiskBadge({ risk, className }: { risk: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        RISK_STYLES[risk] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {risk} Risk
    </span>
  );
}
