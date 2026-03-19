"use client";

import { useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = useMemo(() => searchParams.get("from") || "/dashboard", [searchParams]);

  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: from,
    });
    if (!res || res.error) {
      setError("Invalid email or password");
      return;
    }
    startTransition(() => {
      router.push(res.url ?? from);
      router.refresh();
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Sign in to SmartCRM AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in with demo accounts: <code>admin</code> can view everything; <code>staff</code> can only view customers they own.
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground">Email</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground">Password</label>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          ) : null}

          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-xs text-muted-foreground">
          Tip: Available accounts are listed in `README.md` under Reset + Seed.
        </div>
      </div>
    </main>
  );
}

