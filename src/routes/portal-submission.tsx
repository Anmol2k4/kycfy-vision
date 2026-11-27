import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  KeyRound,
  ClipboardList,
  Upload,
  Send,
  CheckCircle2,
  Loader2,
  Check,
  Bot,
  AlertTriangle,
} from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Application } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal-submission")({
  head: () => ({
    meta: [
      { title: "Portal Submission — KYCFlow AI" },
      {
        name: "description",
        content: "Review and store a clearly labeled demo KYC submission payload.",
      },
    ],
  }),
  component: PortalSubmissionPage,
});
const STEPS = [
  { title: "Review", description: "Confirm the applicant and verified status", icon: KeyRound },
  {
    title: "Build Payload",
    description: "Prepare a structured submission from stored records",
    icon: ClipboardList,
  },
  {
    title: "Attach Documents",
    description: "Include the document metadata and integrity hashes",
    icon: Upload,
  },
  {
    title: "Store Demo Submission",
    description: "Persist the payload locally; no external portal call",
    icon: Send,
  },
  { title: "Recorded", description: "Show the local demo reference", icon: CheckCircle2 },
];
type Submission = {
  id: number;
  applicationId: string;
  mode: string;
  status: string;
  payload: Record<string, unknown>;
  response: { message: string };
  reference: string;
  createdAt: string;
};

function PortalSubmissionPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Application[]>("/applications")
      .then((items) => {
        setApplications(items);
        setSelectedId(items.find((item) => item.status === "Verified")?.id ?? items[0]?.id ?? "");
      })
      .catch((cause) => setError(cause.message));
  }, []);
  useEffect(() => {
    if (!selectedId) {
      setSubmissions([]);
      return;
    }
    api<Submission[]>(`/applications/${encodeURIComponent(selectedId)}/submissions`)
      .then(setSubmissions)
      .catch((cause) => setError(cause.message));
  }, [selectedId]);
  const app = applications.find((item) => item.id === selectedId);
  const latest = submissions[0];
  const submit = async () => {
    if (!selectedId || app?.status !== "Verified") return;
    setSubmitting(true);
    setError("");
    try {
      const created = await api<Submission>(
        `/applications/${encodeURIComponent(selectedId)}/submissions`,
        { method: "POST" },
      );
      setSubmissions((items) => [created, ...items]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Submission could not be recorded.");
    } finally {
      setSubmitting(false);
    }
  };
  const complete = Boolean(latest);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Portal Submission"
        description="Prepare a submission record after a reviewer verifies an application"
      >
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          aria-label="Select application"
          className="h-10 rounded-lg border bg-card px-3 font-mono text-xs font-semibold"
        >
          <option value="">Select an application</option>
          {applications.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} — {item.name} ({item.status})
            </option>
          ))}
        </select>
      </PageHeader>
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft/40 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-xs leading-relaxed text-foreground">
          <strong>Demo adapter only.</strong> This operation stores a payload and generated demo
          reference in your local database. It does not authenticate with or submit to CKYC or any
          external registry.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {!applications.length ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Create an application to begin.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Submission Review</h2>
                  <p className="text-xs text-muted-foreground">
                    {app?.id} · {app?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {app && <StatusBadge status={app.status} />}
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting || complete || app?.status !== "Verified"}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {submitting ? "Recording…" : complete ? "Recorded" : "Record demo submission"}
                </button>
              </div>
            </div>
            {app && (
              <dl className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Applicant</dt>
                  <dd className="mt-1 font-semibold">{app.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Application ID</dt>
                  <dd className="mt-1 font-mono">{app.id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-1">{app.email || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Risk</dt>
                  <dd className="mt-1">
                    {app.risk} · {app.riskScore}/100
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Documents</dt>
                  <dd className="mt-1">
                    {app.documents.length
                      ? app.documents.map((doc) => doc.fileName).join(", ")
                      : "No documents attached"}
                  </dd>
                </div>
              </dl>
            )}
            {app?.status !== "Verified" && (
              <p className="mt-4 text-xs text-warning">
                This action is enabled only after verification and explicit approval.
              </p>
            )}
            <ol className="mt-6 space-y-1">
              {STEPS.map((step, index) => {
                const done = complete;
                const Icon = step.icon;
                return (
                  <li key={step.title} className="flex gap-4 border-b py-4 last:border-0">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full border",
                        done
                          ? "border-success bg-success-soft text-success"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
          <div className="space-y-4">
            <Card className={cn("p-5", complete && "border-success/40 bg-success-soft/30")}>
              <h2 className="text-sm font-bold">Submission Record</h2>
              {latest ? (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="size-5" />
                    <span className="text-sm font-bold">Stored in demo mode</span>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Reference</dt>
                      <dd className="font-mono text-xs font-bold">{latest.reference}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>{latest.status}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Recorded at</dt>
                      <dd>{new Date(latest.createdAt).toLocaleString()}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-muted-foreground">{latest.response.message}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No demo submission has been recorded for this application.
                </p>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="text-sm font-bold">Included in the payload</h2>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>Applicant details currently stored in the application</li>
                <li>Document names, types, and SHA-256 file hashes</li>
                <li>Demo mode marker and local timestamp</li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
