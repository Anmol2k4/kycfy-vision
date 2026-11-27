import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ScanFace } from "lucide-react";
import { api, getToken, setToken } from "@/lib/api";

type User = { id: number; name: string; email: string };
type AuthResponse = { token: string; user: User };

export function AuthGate({
  children,
}: {
  children: (user: User, logout: () => void) => ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("kycfy:unauthorized", handleUnauthorized);
    if (getToken()) {
      api<User>("/auth/me")
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setChecking(false));
    }
    return () => window.removeEventListener("kycfy:unauthorized", handleUnauthorized);
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<AuthResponse>(registering ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          password: String(data.get("password") || ""),
        }),
      });
      setToken(result.token);
      setUser(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to authenticate.");
    } finally {
      setBusy(false);
    }
  };

  if (user) return children(user, logout);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ScanFace className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold">KYCFlow AI</h1>
            <p className="text-sm text-muted-foreground">Secure KYC workspace</p>
          </div>
        </div>
        <h2 className="text-xl font-bold">
          {registering ? "Create your account" : "Sign in to continue"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your applications and documents are private to your account.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {registering && (
            <label className="block text-sm font-medium">
              Full name
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                className="mt-1 h-10 w-full rounded-lg border bg-background px-3"
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              required
              type="email"
              autoComplete="email"
              className="mt-1 h-10 w-full rounded-lg border bg-background px-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              name="password"
              required
              type="password"
              minLength={registering ? 10 : 1}
              autoComplete={registering ? "new-password" : "current-password"}
              className="mt-1 h-10 w-full rounded-lg border bg-background px-3"
            />
            {registering && (
              <span className="mt-1 block text-xs text-muted-foreground">
                Use at least 10 characters.
              </span>
            )}
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {checking && <p className="text-sm text-muted-foreground">Checking your session…</p>}
          <button
            disabled={busy || checking}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setError("");
            setRegistering((value) => !value);
          }}
          className="mt-4 w-full text-sm font-semibold text-primary hover:underline"
        >
          {registering ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}
