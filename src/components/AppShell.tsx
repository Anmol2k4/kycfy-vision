import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileStack,
  ShieldCheck,
  Globe,
  ScrollText,
  ScanFace,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/applications", label: "KYC Applications", icon: Users, exact: false },
  { to: "/documents", label: "Documents", icon: FileStack, exact: false },
  { to: "/verification", label: "Verification", icon: ShieldCheck, exact: false },
  { to: "/portal-submission", label: "Portal Submission", icon: Globe, exact: false },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText, exact: false },
] as const;

function SidebarContent({
  onNavigate,
  user,
  onLogout,
}: {
  onNavigate?: () => void;
  user: { name: string; email: string };
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pt-6 pb-7">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <ScanFace className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold tracking-tight text-sidebar-accent-foreground">
            KYCFlow AI
          </p>
          <p className="text-[11px] font-medium tracking-wide text-sidebar-foreground/70">
            KYC Automation Suite
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-sidebar-primary)]",
            }}
          >
            <item.icon className="size-[18px] shrink-0 opacity-80" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/60 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-bold text-sidebar-primary">
              PP
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-sidebar-accent-foreground">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">{user.email}</p>
            </div>
          </div>
          <p className="mt-2.5 rounded-md bg-sidebar-primary/15 px-2 py-1 text-center text-[10px] font-semibold tracking-wider text-sidebar-primary uppercase">
            Local workspace
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 w-full text-center text-xs font-semibold text-sidebar-foreground/80 hover:text-sidebar-accent-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  user,
  onLogout,
}: {
  children: ReactNode;
  user: { name: string; email: string };
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <ScanFace className="size-5 text-primary" />
          <span className="text-sm font-extrabold tracking-tight">KYCFlow AI</span>
        </div>
      </header>

      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-sidebar lg:block">
        <SidebarContent user={user} onLogout={onLogout} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar shadow-2xl">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} user={user} onLogout={onLogout} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border bg-card shadow-sm", className)}>{children}</div>;
}
