"use client";

import { useActionState, useEffect, useRef } from "react";
import { addOptionGroup, type ActionState } from "@/app/shop/actions";
import { Field } from "@/components/field";

export function AddOptionGroupForm({
  types,
}: {
  types: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addOptionGroup,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="card flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">Add an option group</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Garment type" htmlFor="og_type">
          <select id="og_type" name="garment_type_id" required className="input">
            {types.length === 0 && <option value="">Enable a garment type first</option>}
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Group name" htmlFor="og_name" hint="e.g. Lapel, Vents, Lining">
          <input id="og_name" name="name" required className="input" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="required" className="h-4 w-4 accent-[var(--brass)]" />
          Required
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="multi_select" className="h-4 w-4 accent-[var(--brass)]" />
          Allow multiple
        </label>
      </div>

      {state.error && <p className="text-sm text-brass">{state.error}</p>}

      <button
        type="submit"
        className="btn-primary self-start"
        disabled={pending || types.length === 0}
      >
        {pending ? "Adding…" : "Add group"}
      </button>
    </form>
  );
}
