import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronRight, Plus, X } from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge, RiskBadge } from "@/components/StatusBadge";
import type { KycStatus, Application } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "KYC Applications — KYCFlow AI" },
      {
        name: "description",
        content:
          "Browse, search and filter all KYC applications with live status and risk-level tracking.",
      },
      { property: "og:title", content: "KYC Applications — KYCFlow AI" },
      {
        property: "og:description",
        content:
          "Browse, search and filter all KYC applications with live status and risk-level tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplicationsPage,
});

const FILTERS: Array<"All" | KycStatus> = [
  "All",
  "Verified",
  "Pending",
  "Under Review",
  "Rejected",
];

function ApplicationsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | KycStatus>("All");
  const [risk, setRisk] = useState("All");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    api<Application[]>(
      `/applications?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&risk=${encodeURIComponent(risk)}`,
    )
      .then(setApplications)
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [query, risk, status]);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = applications;
  const createApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const values = Object.fromEntries(form.entries());
      if (!values.email) values.email = null;
      const created = await api<Application>("/applications", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setApplications((items) => [created, ...items]);
      setShowCreate(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create application.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="KYC Applications"
        description="Search, filter and drill into every application in the pipeline"
      >
        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Plus className="size-4" />
          New application
        </button>
      </PageHeader>

      {showCreate && (
        <Card className="mb-4 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Applicant details</h2>
            <button type="button" aria-label="Close form" onClick={() => setShowCreate(false)}>
              <X className="size-4" />
            </button>
          </div>
          <form
            onSubmit={createApplication}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["dob", "Date of birth"],
              ["gender", "Gender"],
              ["address", "Address"],
              ["aadhaar", "Aadhaar number"],
              ["pan", "PAN"],
            ].map(([name, label]) => (
              <label key={name} className="text-xs font-semibold text-muted-foreground">
                {label}
                <input
                  name={name}
                  required={name === "name"}
                  type={name === "email" ? "email" : name === "dob" ? "date" : "text"}
                  className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground"
                />
              </label>
            ))}
            <div className="flex items-end">
              <button
                disabled={saving}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create application"}
              </button>
            </div>
          </form>
        </Card>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or application ID…"
              className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatus(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  status === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
            <select
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
              aria-label="Filter by risk"
              className="h-8 rounded-full border bg-background px-3 text-xs font-semibold"
            >
              <option value="All">All risk levels</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3">Application ID</th>
                <th className="px-5 py-3">Applicant Name</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Risk Level</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Loading applications…
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground">
                      {app.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                          {app.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="font-semibold text-foreground">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{app.date}</td>
                    <td className="px-5 py-3.5">
                      <RiskBadge risk={app.risk} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to="/applications/$id"
                        params={{ id: app.id }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No applications match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          Showing {filtered.length} application{filtered.length === 1 ? "" : "s"}
        </div>
      </Card>
    </div>
  );
}
