"use client";

import { useActionState, useEffect, useRef } from "react";
import { addShippingOption, type ActionState } from "@/app/shop/actions";
import { Field } from "@/components/field";

export function AddShippingForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addShippingOption,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="card flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">Add a shipping option</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" htmlFor="ship_label" hint="What the customer sees.">
          <input id="ship_label" name="label" required className="input" placeholder="DHL Express" />
        </Field>
        <Field label="Carrier" htmlFor="ship_carrier">
          <input id="ship_carrier" name="carrier" className="input" placeholder="DHL" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price — first item (USD)" htmlFor="ship_base">
          <input id="ship_base" name="base_price" inputMode="decimal" className="input" placeholder="70.00" />
        </Field>
        <Field
          label="Each additional item (USD)"
          htmlFor="ship_add"
          hint="Optional. Leave blank if flat regardless of count."
        >
          <input id="ship_add" name="additional_item_price" inputMode="decimal" className="input" placeholder="0.00" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Min days" htmlFor="ship_min">
          <input id="ship_min" name="min_days" type="number" min={0} inputMode="numeric" className="input" placeholder="5" />
        </Field>
        <Field label="Max days" htmlFor="ship_max">
          <input id="ship_max" name="max_days" type="number" min={0} inputMode="numeric" className="input" placeholder="7" />
        </Field>
      </div>

      {state.error && <p className="text-sm text-brass">{state.error}</p>}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? "Adding…" : "Add option"}
      </button>

      <p className="text-xs text-ink-soft">
        You own and quote shipping (flat rate, by item count). Not live carrier rates.
      </p>
    </form>
  );
}
