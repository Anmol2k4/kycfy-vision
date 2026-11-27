import { useEffect, useState } from "react";
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
  Play,
  Loader2,
} from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Application } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Verification — KYCFlow AI" },
      {
        name: "description",
        content:
          "Compare applicant-provided information with document text extraction and review explainable verification results.",
      },
    ],
  }),
  component: VerificationPage,
});
const CHECK_ICONS = [UserCheck, CalendarCheck2, FileCheck2, Fingerprint];
type Verification = {
  applicationId: string;
  status: string;
  score: number;
  checks: { label: string; score: number; status: "Pass" | "Review" | "Fail" }[];
  comparisons: {
    field: string;
    document: string;
    entered: string;
    score: number;
    status: string;
  }[];
  reasons: string[];
  riskScore: number;
  riskLevel: string;
};

function VerificationPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Application[]>("/applications")
      .then((items) => {
        setApplications(items);
        setSelectedId(items[0]?.id ?? "");
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);
  const loadResult = (id: string) => {
    if (id)
      api<Verification>(`/applications/${encodeURIComponent(id)}/verification`)
        .then(setResult)
        .catch((cause) => setError(cause.message));
  };
  useEffect(() => {
    loadResult(selectedId);
  }, [selectedId]);
  const verify = async () => {
    if (!selectedId) return;
    setRunning(true);
    setError("");
    try {
      const response = await api<{
        application: Application;
        score: number;
        comparisons: Verification["comparisons"];
        reasons: string[];
      }>(`/applications/${encodeURIComponent(selectedId)}/verify`, { method: "POST" });
      setApplications((items) =>
        items.map((item) => (item.id === selectedId ? response.application : item)),
      );
      setResult(
        await api<Verification>(`/applications/${encodeURIComponent(selectedId)}/verification`),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Verification could not be completed.");
    } finally {
      setRunning(false);
    }
  };
  const app = applications.find((item) => item.id === selectedId);
  const score = result?.score ?? 0;
  const verified = result?.status === "Verified";
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const color =
    score >= 85
      ? "var(--color-success)"
      : score >= 60
        ? "var(--color-warning)"
        : "var(--color-destructive)";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Verification"
        description="Compare extracted document text with applicant-provided information"
      >
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Select application"
            className="h-10 rounded-lg border bg-card px-3 font-mono text-xs font-semibold"
            disabled={!applications.length}
          >
            <option value="">Select an application</option>
            {applications.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} — {item.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void verify()}
            disabled={!selectedId || running}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {running ? "Checking…" : "Run verification"}
          </button>
        </div>
      </PageHeader>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {loading && (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading applications…</p>
      )}
      {!loading && !applications.length && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Create an application and upload documents before running verification.
        </Card>
      )}
      {app && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-sm font-bold">Verification Match Score</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {app.id} · risk {app.riskScore}/100 ({app.risk})
              </p>
              <div className="relative my-5">
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
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl font-bold" style={{ color }}>
                    {score}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground">out of 100</span>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold",
                  verified ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                )}
              >
                {verified ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
                {result?.status ?? "Not verified"}
              </span>
              <p className="mt-3 max-w-60 text-xs leading-relaxed text-muted-foreground">
                Rule-based comparison only. This is not an official identity or document
                authenticity check.
              </p>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-bold">Verification Checks</h2>
              {!result?.checks.length && (
                <p className="text-sm text-muted-foreground">
                  Run verification to calculate field matches from uploaded document text.
                </p>
              )}
              <ul className="space-y-5">
                {result?.checks.map((check, index) => {
                  const Icon = CHECK_ICONS[index] ?? Fingerprint;
                  return (
                    <li key={check.label} className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          check.status === "Pass"
                            ? "bg-success-soft text-success"
                            : check.status === "Fail"
                              ? "bg-destructive-soft text-destructive"
                              : "bg-warning-soft text-warning",
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{check.label}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold">
                              {check.score ? `${check.score}%` : "Not extracted"}
                            </span>
                            <StatusBadge status={check.status} />
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
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
          {result?.reasons.length ? (
            <Card className="mt-4 border-warning/40 bg-warning-soft/30 p-5">
              <h2 className="text-sm font-bold">Review findings</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {result.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card className="mt-4 overflow-hidden">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-bold">Field-Level Comparison</h2>
              <p className="text-xs text-muted-foreground">
                Extracted text vs applicant-provided values
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3">Field</th>
                    <th className="px-5 py-3">Document value</th>
                    <th className="px-5 py-3">Application value</th>
                    <th className="px-5 py-3">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.comparisons.map((row) => (
                    <tr key={row.field} className="border-b last:border-0">
                      <td className="px-5 py-3.5 font-semibold">{row.field}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        {row.document}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        {row.entered}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-bold",
                            row.status === "Pass"
                              ? "text-success"
                              : row.status === "Fail"
                                ? "text-destructive"
                                : "text-warning",
                          )}
                        >
                          {row.status === "Pass" ? (
                            <Check className="size-4" />
                          ) : row.status === "Fail" ? (
                            <X className="size-4" />
                          ) : (
                            <Minus className="size-4" />
                          )}
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
