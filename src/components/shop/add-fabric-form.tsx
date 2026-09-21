"use client";

import { useActionState, useEffect, useRef } from "react";
import { addFabric, type ActionState } from "@/app/shop/actions";
import { Field } from "@/components/field";

export function AddFabricForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addFabric,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="card flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">Add a fabric</h2>

      <Field label="Name" htmlFor="name">
        <input id="name" name="name" required className="input" placeholder="Navy wool herringbone" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Composition" htmlFor="composition">
          <input id="composition" name="composition" className="input" placeholder="100% wool" />
        </Field>
        <Field label="Price (USD)" htmlFor="price_amount" hint="Per-garment fabric price.">
          <input
            id="price_amount"
            name="price_amount"
            type="text"
            inputMode="decimal"
            className="input"
            placeholder="0.00"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Color" htmlFor="color">
          <input id="color" name="color" className="input" placeholder="Navy" />
        </Field>
        <Field label="Pattern" htmlFor="pattern">
          <input id="pattern" name="pattern" className="input" placeholder="Herringbone" />
        </Field>
      </div>

      <Field label="Photo" htmlFor="photo" hint="Becomes the material tile. JPG/PNG, up to 8MB.">
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className="input"
        />
      </Field>

      {state.error && <p className="text-sm text-brass">{state.error}</p>}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? "Adding…" : "Add fabric"}
      </button>

      <p className="text-xs text-ink-soft">
        The photo is used as the material tile now; AI normalization (clean
        swatch + extracted attributes) is a later step.
      </p>
    </form>
  );
}
