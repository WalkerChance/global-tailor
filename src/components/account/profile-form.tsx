"use client";

import { useActionState } from "react";
import { saveCustomerProfile, type ProfileState } from "@/app/account/actions";
import { Field } from "@/components/field";

export function CustomerProfileForm({
  initial,
}: {
  initial: { display_name?: string | null; phone?: string | null };
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    saveCustomerProfile,
    {},
  );

  return (
    <form action={formAction} className="card flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">Contact</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="display_name">
          <input
            id="display_name"
            name="display_name"
            defaultValue={initial.display_name ?? ""}
            className="input"
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initial.phone ?? ""}
            className="input"
          />
        </Field>
      </div>
      {state.error && <p className="text-sm text-brass">{state.error}</p>}
      {state.ok && <p className="text-sm text-ink-soft">Saved ✓</p>}
      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
