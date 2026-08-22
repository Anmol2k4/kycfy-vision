import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  KeyRound,
  ClipboardList,
  Upload,
  Send,
  CheckCircle2,
  Play,
  RotateCcw,
  Loader2,
  Check,
  Bot,
} from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal-submission")({
  head: () => ({
    meta: [
      { title: "Portal Submission — KYCFlow AI" },
      {
        name: "description",
        content:
          "Watch KYCFlow AI's browser automation authenticate, fill forms, upload documents and submit verified KYC applications to the regulator portal.",
      },
      { property: "og:title", content: "Portal Submission — KYCFlow AI" },
      {
        property: "og:description",
        content:
          "Watch KYCFlow AI's browser automation authenticate, fill forms, upload documents and submit verified KYC applications to the regulator portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalSubmissionPage,
});

const STEPS = [
  {
    title: "Authenticate",
    description: "Signing in to the CKYC regulator portal with stored credentials",
    icon: KeyRound,
  },
  {
    title: "Enter Data",
    description: "Auto-filling applicant details into 14 portal form fields",
    icon: ClipboardList,
  },
  {
    title: "Upload Documents",
    description: "Attaching verified Aadhaar and PAN documents",
    icon: Upload,
  },
  {
    title: "Submit",
    description: "Submitting the application and waiting for portal validation",
    icon: Send,
  },
  {
    title: "Confirmation",
    description: "Capturing the acknowledgement reference number",
    icon: CheckCircle2,
  },
];

const STEP_DURATION = 1600;

function PortalSubmissionPage() {
  const [stepIndex, setStepIndex] = useState(-1); // -1 = idle
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const done = stepIndex >= STEPS.length;

  const start = () => {
    if (running) return;
    setStepIndex(0);
    setRunning(true);
  };

  const reset = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    setStepIndex(-1);
  };

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev + 1 >= STEPS.length) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          return STEPS.length;
        }
        return prev + 1;
      });
    }, STEP_DURATION);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running]);

  const progress = Math.min(100, Math.max(0, (stepIndex / STEPS.length) * 100));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Portal Submission"
        description="Browser automation submits verified applications to the regulator portal"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Bot className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Automation Workflow</h2>
                <p className="text-xs text-muted-foreground">
                  Application KYC-2026-1042 · Aarav Sharma
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {done && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={start}
                disabled={running || done}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                  running || done
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {running ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                {running ? "Running…" : done ? "Completed" : "Start Submission"}
              </button>
            </div>
          </div>

          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${done ? 100 : progress}%` }}
            />
          </div>

          <ol className="space-y-1">
            {STEPS.map((step, i) => {
              const isDone = done || i < stepIndex;
              const isCurrent = !done && i === stepIndex && running;
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "absolute top-10 left-[19px] h-[calc(100%-2.5rem)] w-0.5 rounded-full transition-colors",
                        isDone ? "bg-success" : "bg-border",
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isDone && "border-success bg-success text-success-foreground",
                      isCurrent &&
                        "border-primary bg-primary-soft text-primary ring-4 ring-primary/15",
                      !isDone && !isCurrent && "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? (
                      <Check className="size-4" />
                    ) : isCurrent ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <div className="pt-1.5">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        isCurrent
                          ? "text-primary"
                          : isDone
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                    {isCurrent && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                        IN PROGRESS
                      </p>
                    )}
                    {isDone && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                        COMPLETED
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card className={cn("p-5 transition-colors", done && "border-success/40 bg-success-soft/40")}>
            <h2 className="text-sm font-bold text-foreground">Submission Result</h2>
            {done ? (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="size-5" />
                  <span className="text-sm font-bold">Portal acknowledgement received</span>
                </div>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Reference No.</dt>
                    <dd className="font-mono text-xs font-bold text-foreground">
                      ACK-2026-88412
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Portal</dt>
                    <dd className="text-xs font-semibold text-foreground">CKYC India Registry</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Submitted At</dt>
                    <dd className="font-mono text-xs font-semibold text-foreground">
                      2026-08-22 08:14 IST
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Elapsed</dt>
                    <dd className="font-mono text-xs font-semibold text-foreground">
                      {(STEPS.length * STEP_DURATION) / 1000}s (simulated)
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {running
                  ? "The automation agent is working through the portal steps. The acknowledgement will appear here."
                  : "Press Start Submission to run the simulated portal automation for this application."}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-foreground">Why automate?</h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                Eliminates manual re-entry into regulator portals
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                Cuts submission time from ~20 minutes to seconds
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                Every step is captured in the audit log for compliance
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
