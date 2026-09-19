import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="font-serif text-2xl font-medium">Create your account</h1>
      <p className="mt-1 text-sm text-ink-soft">
        You start as a customer. Every account is role-based — a tailor or admin
        role can be added later.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
