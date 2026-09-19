"use client";

import { useActionState, useEffect, useRef } from "react";
import { grantRole, type AdminState } from "@/app/admin/actions";
import { Field } from "@/components/field";

export function GrantRoleForm() {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    grantRole,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="card flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">Grant a role</h2>
      <p className="text-sm text-ink-soft">
        The person must already have an account. Everyone is a customer by
        default; grant <b>tailor</b> to let them set up a shop.
      </p>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Email" htmlFor="grant_email">
          <input
            id="grant_email"
            name="email"
            type="email"
            required
            className="input"
            placeholder="tailor@example.com"
          />
        </Field>
        <Field label="Role" htmlFor="grant_role">
          <select id="grant_role" name="role" className="input" defaultValue="tailor">
            <option value="tailor">tailor</option>
            <option value="admin">admin</option>
            <option value="finisher">finisher</option>
          </select>
        </Field>
      </div>

      {state.error && <p className="text-sm text-brass">{state.error}</p>}
      {state.message && !state.error && (
        <p className="text-sm text-ink-soft">{state.message}</p>
      )}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? "Granting…" : "Grant role"}
      </button>
    </form>
  );
}
