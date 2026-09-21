"use client";

import { useActionState } from "react";
import { saveProfile, type ActionState } from "@/app/shop/actions";
import { Field } from "@/components/field";

export type ProfileInitial = {
  shop_name?: string | null;
  slug?: string | null;
  bio?: string | null;
  location_city?: string | null;
  location_country?: string | null;
  turnaround_days?: number | null;
  languages?: string[] | null;
};

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveProfile,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Shop name" htmlFor="shop_name">
        <input
          id="shop_name"
          name="shop_name"
          required
          defaultValue={initial.shop_name ?? ""}
          className="input"
        />
      </Field>

      <Field
        label="Shop URL"
        htmlFor="slug"
        hint="Leave blank to generate from the shop name. Lowercase, letters, numbers, dashes."
      >
        <input
          id="slug"
          name="slug"
          defaultValue={initial.slug ?? ""}
          placeholder="e.g. tailor-lagos"
          className="input"
        />
      </Field>

      <Field label="Story / bio" htmlFor="bio">
        <textarea
          id="bio"
          name="bio"
          defaultValue={initial.bio ?? ""}
          className="textarea"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="location_city">
          <input
            id="location_city"
            name="location_city"
            defaultValue={initial.location_city ?? ""}
            className="input"
          />
        </Field>
        <Field label="Country" htmlFor="location_country">
          <input
            id="location_country"
            name="location_country"
            defaultValue={initial.location_country ?? ""}
            className="input"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Turnaround (days)" htmlFor="turnaround_days">
          <input
            id="turnaround_days"
            name="turnaround_days"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={initial.turnaround_days ?? ""}
            className="input"
          />
        </Field>
        <Field
          label="Languages"
          htmlFor="languages"
          hint="Comma-separated, e.g. English, French"
        >
          <input
            id="languages"
            name="languages"
            defaultValue={(initial.languages ?? []).join(", ")}
            className="input"
          />
        </Field>
      </div>

      {state.error && <p className="text-sm text-brass">{state.error}</p>}
      {state.ok && <p className="text-sm text-ink-soft">Saved ✓</p>}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? "Saving…" : "Save shop"}
      </button>
    </form>
  );
}
