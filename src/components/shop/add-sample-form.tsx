"use client";

import { useActionState, useEffect, useRef } from "react";
import { addSample, type ActionState } from "@/app/shop/actions";
import { Field } from "@/components/field";

export function AddSampleForm({
  types,
}: {
  types: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addSample,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="card flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">Add a sample</h2>
      <p className="text-sm text-ink-soft">
        Photos of finished work — your portfolio, shown on your shop page.
      </p>

      <Field label="Title" htmlFor="s_title">
        <input id="s_title" name="title" required className="input" placeholder="Navy three-piece suit" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Garment type" htmlFor="s_type">
          <select id="s_type" name="garment_type_id" className="input" defaultValue="">
            <option value="">— (optional)</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Photo" htmlFor="s_photo" hint="JPG/PNG, up to 8MB.">
          <input id="s_photo" name="photo" type="file" accept="image/*" className="input" />
        </Field>
      </div>

      <Field label="Description" htmlFor="s_desc">
        <textarea id="s_desc" name="description" className="textarea" />
      </Field>

      {state.error && <p className="text-sm text-brass">{state.error}</p>}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? "Adding…" : "Add sample"}
      </button>
    </form>
  );
}
