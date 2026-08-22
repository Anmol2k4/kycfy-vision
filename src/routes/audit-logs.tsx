import { createFileRoute, Link } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { auditLogs } from "@/lib/mock-data";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — KYCFlow AI" },
      {
        name: "description",
        content:
          "Immutable audit trail of every KYCFlow AI action: uploads, OCR extraction, verification checks, decisions and portal submissions.",
      },
      { property: "og:title", content: "Audit Logs — KYCFlow AI" },
      {
        property: "og:description",
        content:
          "Immutable audit trail of every KYCFlow AI action: uploads, OCR extraction, verification checks, decisions and portal submissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Audit Logs"
        description="Every automated and manual action, recorded for compliance review"
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2.5 border-b px-5 py-4">
          <ScrollText className="size-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-bold text-foreground">Activity Trail</h2>
            <p className="text-xs text-muted-foreground">
              {auditLogs.length} events · 22 August 2026
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Application ID</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, i) => (
                <tr
                  key={`${log.timestamp}-${i}`}
                  className="border-b transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
                    {log.timestamp}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground">{log.action}</td>
                  <td className="px-5 py-3.5">
                    <Link
                      to="/applications/$id"
                      params={{ id: log.applicationId }}
                      className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      {log.applicationId}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          Audit entries are append-only and retained for 10 years per compliance policy.
        </div>
      </Card>
    </div>
  );
}
