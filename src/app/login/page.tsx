import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="font-serif text-2xl font-medium">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-soft">Sign in to your account.</p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
