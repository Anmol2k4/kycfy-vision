import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ScrollText, Search } from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — KYCFlow AI" },
      {
        name: "description",
        content:
          "Append-only record of account activity, application changes, document uploads, verification, and submissions.",
      },
    ],
  }),
  component: AuditLogsPage,
});
type AuditRecord = {
  id: number;
  timestamp: string;
  action: string;
  applicationId: string | null;
  user: string;
  status: string;
  details: string;
};

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setLoading(true);
    api<AuditRecord[]>(
      `/audit-logs?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`,
    )
      .then(setLogs)
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [query, status]);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Audit Logs"
        description="Append-only record of actions performed in your workspace"
      />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ScrollText className="size-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-bold">Activity Trail</h2>
              <p className="text-xs text-muted-foreground">
                {logs.length} recorded event{logs.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <label className="relative">
              <span className="sr-only">Search audit log</span>
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search activity…"
                className="h-9 w-52 rounded-lg border bg-background pr-3 pl-9 text-sm"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter audit status"
              className="h-9 rounded-lg border bg-background px-3 text-sm"
            >
              <option>All</option>
              <option>Success</option>
              <option>Info</option>
              <option>Warning</option>
              <option>Failed</option>
            </select>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="border-b bg-destructive-soft px-5 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Application ID</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    Loading audit events…
                  </td>
                </tr>
              )}
              {!loading &&
                logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {log.action}
                      {log.details && (
                        <p className="mt-1 max-w-md text-xs text-muted-foreground">{log.details}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.applicationId ? (
                        <Link
                          to="/applications/$id"
                          params={{ id: log.applicationId }}
                          className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          {log.applicationId}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm">{log.user}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
              {!loading && !logs.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No audit events match this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          Audit entries are append-only in the application API and cannot be edited or deleted in
          the interface.
        </div>
      </Card>
    </div>
  );
}
