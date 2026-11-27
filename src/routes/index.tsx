import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Files, Clock, BadgeCheck, XCircle, ChevronRight, TrendingUp } from "lucide-react";
import { PageHeader, Card } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge, RiskBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Application } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — KYCFlow AI" },
      {
        name: "description",
        content:
          "Overview of the KYCFlow AI pipeline: application volumes, verification status distribution and recent KYC activity.",
      },
      { property: "og:title", content: "Dashboard — KYCFlow AI" },
      {
        property: "og:description",
        content:
          "Overview of the KYCFlow AI pipeline: application volumes, verification status distribution and recent KYC activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type DashboardData = {
  counts: { total: number; verified: number; pending: number; rejected: number; underReview: number };
  verificationRate: number;
  statusCounts: Record<string, number>;
  weeklyVolume: { day: string; count: number }[];
  recent: Application[];
};

function StatusDonut({ counts }: { counts: DashboardData["counts"] }) {
  const segments = [
    { label: "Verified", value: counts.verified, color: "var(--color-success)" },
    { label: "Pending", value: counts.pending, color: "var(--color-warning)" },
    { label: "Rejected", value: counts.rejected, color: "var(--color-destructive)" },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
      <div className="relative">
        <svg width="168" height="168" viewBox="0 0 168 168" className="-rotate-90">
          <circle
            cx="84"
            cy="84"
            r={radius}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="16"
          />
          {segments.map((seg) => {
            const fraction = seg.value / total;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={seg.label}
                cx="84"
                cy="84"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-700"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-foreground">
            {total.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="space-y-3">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-3">
            <span className="size-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="w-20 text-sm font-medium text-muted-foreground">{seg.label}</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {seg.value.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              ({Math.round((seg.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeeklyBars({ weeklyVolume }: { weeklyVolume: DashboardData["weeklyVolume"] }) {
  const max = Math.max(1, ...weeklyVolume.map((d) => d.count));
  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {weeklyVolume.map((d, i) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground">
              {d.count}
            </span>
            <div
              className="w-full max-w-10 rounded-t-md bg-primary/85 transition-all duration-500 hover:bg-primary"
              style={{
                height: `${(d.count / max) * 100}%`,
                transitionDelay: `${i * 40}ms`,
              }}
              title={`${d.day}: ${d.count} applications`}
            />
            <span className="text-[11px] font-medium text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<DashboardData>("/dashboard")
      .then(setData)
      .catch((cause) => setError(cause.message));
  }, []);
  const recent = data?.recent ?? [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Dashboard"
        description="Pipeline overview and verification activity — Friday, 22 August 2026"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Files}
          label="Total Applications"
          value={(data?.counts.total ?? 0).toLocaleString()}
          hint="Stored applications in your workspace"
          tone="primary"
        />
        <StatCard
          icon={Clock}
          label="Pending Verification"
          value={String(data?.counts.pending ?? 0)}
          hint={`${data?.counts.underReview ?? 0} flagged for manual review`}
          tone="warning"
        />
        <StatCard
          icon={BadgeCheck}
          label="Verified"
          value={(data?.counts.verified ?? 0).toLocaleString()}
          hint={`${data?.verificationRate ?? 0}% verified`}
          tone="success"
        />
        <StatCard
          icon={XCircle}
          label="Rejected"
          value={String(data?.counts.rejected ?? 0)}
          hint="Applications rejected after review"
          tone="destructive"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Verification Status</h2>
              <p className="text-xs text-muted-foreground">Distribution across your applications</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
              <TrendingUp className="size-3.5" />
              {data?.verificationRate ?? 0}% verified
            </span>
          </div>
          <StatusDonut
            counts={data?.counts ?? { total: 0, verified: 0, pending: 0, rejected: 0 }}
          />
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-foreground">Applications This Week</h2>
            <p className="text-xs text-muted-foreground">New submissions per day</p>
          </div>
          <WeeklyBars weeklyVolume={data?.weeklyVolume ?? []} />
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Recent KYC Applications</h2>
            <p className="text-xs text-muted-foreground">Latest submissions in the pipeline</p>
          </div>
          <Link
            to="/applications"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View all
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
        {error && (
          <p
            role="alert"
            className="border-b bg-destructive-soft px-5 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {!data && !error && (
          <p className="border-b px-5 py-8 text-center text-sm text-muted-foreground">
            Loading dashboard…
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3">Application ID</th>
                <th className="px-5 py-3">Applicant</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {recent.map((app) => (
                <tr
                  key={app.id}
                  className="border-b transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground">
                    {app.id}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{app.name}</td>
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
                      Details
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {data && recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No applications yet. Create an application to see dashboard activity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
