import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronRight } from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge, RiskBadge } from "@/components/StatusBadge";
import { applications, type KycStatus } from "@/lib/mock-data";
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesQuery =
        q.length === 0 ||
        app.name.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q);
      const matchesStatus = status === "All" || app.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="KYC Applications"
        description="Search, filter and drill into every application in the pipeline"
      />

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
              {filtered.map((app) => (
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
          Showing {filtered.length} of {applications.length} applications
        </div>
      </Card>
    </div>
  );
}
