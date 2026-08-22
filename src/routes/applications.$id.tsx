import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Upload,
  ScanText,
  FileCheck2,
  ShieldCheck,
  Scale,
  Check,
  FileText,
  Sparkles,
  Gauge,
} from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge, RiskBadge } from "@/components/StatusBadge";
import { getApplication, WORKFLOW_STAGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/applications/$id")({
  head: ({ params }) => {
    const app = getApplication(params.id);
    const title = app
      ? `${app.name} (${app.id}) — KYCFlow AI`
      : "Application not found — KYCFlow AI";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: app
            ? `KYC application ${app.id} for ${app.name}: documents, verification checks, risk score and AI recommendation.`
            : "The requested KYC application could not be found.",
        },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ApplicationDetails,
});

const STAGE_ICONS = [Upload, ScanText, FileCheck2, ShieldCheck, Scale];

function WorkflowStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex items-center">
      {WORKFLOW_STAGES.map((stage, i) => {
        const Icon = STAGE_ICONS[i];
        const done = i < currentStep;
        const current = i === currentStep;
        return (
          <li key={stage} className={cn("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-3",
                  i <= currentStep ? "bg-success" : "bg-border",
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 transition-all",
                  done && "border-success bg-success text-success-foreground",
                  current &&
                    "border-primary bg-primary-soft text-primary ring-4 ring-primary/15",
                  !done && !current && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-4" />}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold whitespace-nowrap",
                  current ? "text-primary" : done ? "text-success" : "text-muted-foreground",
                )}
              >
                {stage}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-semibold text-foreground", mono && "font-mono")}>
        {value}
      </dd>
    </div>
  );
}

function ApplicationDetails() {
  const { id } = Route.useParams();
  const app = getApplication(id);

  if (!app) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-bold text-foreground">Application not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No application exists with ID <span className="font-mono">{id}</span>.
        </p>
        <Link
          to="/applications"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="size-4" />
          Back to applications
        </Link>
      </div>
    );
  }

  const scoreColor =
    app.riskScore >= 70
      ? "var(--color-destructive)"
      : app.riskScore >= 35
        ? "var(--color-warning)"
        : "var(--color-success)";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Link
        to="/applications"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to KYC Applications
      </Link>

      <PageHeader title={app.name} description={`Application ${app.id} · Submitted ${app.date}`}>
        <div className="flex items-center gap-2">
          <RiskBadge risk={app.risk} />
          <StatusBadge status={app.status} />
        </div>
      </PageHeader>

      <Card className="overflow-x-auto p-5">
        <h2 className="mb-5 text-sm font-bold text-foreground">Processing Workflow</h2>
        <div className="min-w-[560px]">
          <WorkflowStepper currentStep={app.workflowStep} />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold text-foreground">Applicant Information</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField label="Full Name" value={app.name} />
              <InfoField label="Date of Birth" value={app.dob} mono />
              <InfoField label="Gender" value={app.gender} />
              <InfoField label="Phone" value={app.phone} mono />
              <InfoField label="Email" value={app.email} />
              <InfoField label="Aadhaar Number" value={app.aadhaar} mono />
              <InfoField label="PAN" value={app.pan} mono />
              <InfoField label="Address" value={app.address} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold text-foreground">Uploaded Documents</h2>
            <ul className="divide-y">
              {app.documents.map((doc) => (
                <li key={doc.fileName} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{doc.type}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {doc.fileName} · {doc.size}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold text-foreground">Verification Checks</h2>
            <ul className="space-y-4">
              {app.checks.map((check) => (
                <li key={check.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{check.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {check.score > 0 ? `${check.score}%` : "—"}
                      </span>
                      <StatusBadge status={check.status} />
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
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
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Risk Score</h2>
            </div>
            <div className="flex items-end gap-2">
              <span
                className="font-mono text-5xl font-bold tracking-tight"
                style={{ color: scoreColor }}
              >
                {app.riskScore}
              </span>
              <span className="pb-1.5 text-sm font-medium text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${app.riskScore}%`, backgroundColor: scoreColor }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {app.riskScore >= 70
                  ? "Enhanced due diligence required"
                  : app.riskScore >= 35
                    ? "Standard review recommended"
                    : "Clean profile — low exposure"}
              </span>
              <RiskBadge risk={app.risk} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Sparkles className="size-4" />
              </div>
              <h2 className="text-sm font-bold text-foreground">AI Recommendation</h2>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                app.aiAction === "Auto-Approve" && "bg-success-soft text-success",
                app.aiAction === "Manual Review" && "bg-warning-soft text-warning",
                app.aiAction === "Reject" && "bg-destructive-soft text-destructive",
              )}
            >
              {app.aiAction}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {app.aiRecommendation}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg bg-success px-3 py-2 text-xs font-bold text-success-foreground transition-opacity hover:opacity-90"
              >
                Approve
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                Escalate
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground transition-opacity hover:opacity-90"
              >
                Reject
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
