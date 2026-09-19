"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "check-email">("idle");
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
        setStatus("idle");
        return;
      }
      // If email confirmation is on, there is no session yet.
      if (!data.session) {
        setStatus("check-email");
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setStatus("idle");
        return;
      }
      router.push(next);
      router.refresh();
    }
  }

  if (status === "check-email") {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="font-serif text-xl font-medium">Check your email</h2>
        <p className="mt-2 text-sm text-ink-soft">
          We sent a confirmation link to <b>{email}</b>. Open it to finish
          creating your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {isSignup && (
        <Field id="name" label="Name">
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </Field>
      )}
      <Field id="email" label="Email">
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
      </Field>
      <Field id="password" label="Password">
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
      </Field>

      {error && <p className="text-sm text-[var(--brass)]">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-brass px-4 py-2.5 font-mono text-sm font-medium text-navy disabled:opacity-60"
      >
        {status === "loading"
          ? "Working…"
          : isSignup
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-center font-mono text-xs text-ink-soft">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-brass">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-brass">
              Create an account
            </Link>
          </>
        )}
      </p>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--ink);
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 15px;
        }
        .input:focus { outline: 2px solid var(--brass); outline-offset: 1px; }
      `}</style>
    </form>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      {children}
    </label>
  );
}
