import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  UserCheck,
  CalendarCheck2,
  FileCheck2,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Minus,
} from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { applications, getApplication } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Verification — KYCFlow AI" },
      {
        name: "description",
        content:
          "AI identity verification results: name and date-of-birth matching, document validity, identity match and overall verification scores.",
      },
      { property: "og:title", content: "Verification — KYCFlow AI" },
      {
        property: "og:description",
        content:
          "AI identity verification results: name and date-of-birth matching, document validity, identity match and overall verification scores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerificationPage,
});

const CHECK_ICONS = [UserCheck, CalendarCheck2, FileCheck2, Fingerprint];

function ScoreRing({ score }: { score: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const color =
    score >= 85 ? "var(--color-success)" : score >= 60 ? "var(--color-warning)" : "var(--color-destructive)";

  return (
    <div className="relative">
      <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="12"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          out of 100
        </span>
      </div>
    </div>
  );
}

function VerificationPage() {
  const [selectedId, setSelectedId] = useState("KYC-2026-1042");
  const app = getApplication(selectedId) ?? applications[0];

  const overall = useMemo(() => {
    const scored = app.checks.filter((c) => c.score > 0);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((s, c) => s + c.score, 0) / scored.length);
  }, [app]);

  const verified = overall >= 85;

  const comparisons = [
    { field: "Full Name", document: app.name, entered: app.name, score: app.checks[0].score },
    { field: "Date of Birth", document: app.dob, entered: app.dob, score: app.checks[1].score },
    { field: "Aadhaar Number", document: app.aadhaar, entered: app.aadhaar, score: app.checks[2].score },
    { field: "PAN", document: app.pan, entered: app.pan, score: app.checks[2].score },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Verification"
        description="AI cross-checks document data against the application — field by field"
      >
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-10 rounded-lg border bg-card px-3 font-mono text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/40"
          aria-label="Select application"
        >
          {applications.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id} — {a.name}
            </option>
          ))}
        </select>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-sm font-bold text-foreground">Overall Verification Score</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{app.id}</p>
          <div className="my-5">
            <ScoreRing score={overall} />
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold",
              verified ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
            )}
          >
            {verified ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
            {verified ? "Verified" : "Requires Review"}
          </span>
          <p className="mt-3 max-w-56 text-xs leading-relaxed text-muted-foreground">
            {verified
              ? "All checks cleared the 85% auto-approval threshold."
              : "One or more checks fell below the auto-approval threshold."}
          </p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-foreground">Verification Checks</h2>
          <ul className="space-y-5">
            {app.checks.map((check, i) => {
              const Icon = CHECK_ICONS[i] ?? Fingerprint;
              return (
                <li key={check.label} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      check.status === "Pass" && "bg-success-soft text-success",
                      check.status === "Review" && "bg-warning-soft text-warning",
                      check.status === "Fail" && "bg-destructive-soft text-destructive",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{check.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {check.score > 0 ? `${check.score}%` : "Pending"}
                        </span>
                        <StatusBadge status={check.status} />
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          check.status === "Pass"
                            ? "bg-success"
                            : check.status === "Fail"
                              ? "bg-destructive"
                              : "bg-warning",
                        )}
                        style={{ width: `${check.score}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">Field-Level Comparison</h2>
          <p className="text-xs text-muted-foreground">
            Values extracted by OCR vs. values entered by the applicant
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3">Field</th>
                <th className="px-5 py-3">Document Value</th>
                <th className="px-5 py-3">Application Value</th>
                <th className="px-5 py-3">Match</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => {
                const state = row.score >= 85 ? "pass" : row.score >= 60 ? "review" : "fail";
                return (
                  <tr key={row.field} className="border-b last:border-0">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{row.field}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {row.document}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {row.entered}
                    </td>
                    <td className="px-5 py-3.5">
                      {state === "pass" && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
                          <Check className="size-4" /> Match
                        </span>
                      )}
                      {state === "review" && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-warning">
                          <Minus className="size-4" /> Partial
                        </span>
                      )}
                      {state === "fail" && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
                          <X className="size-4" /> Mismatch
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
