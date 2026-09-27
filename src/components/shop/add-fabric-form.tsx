"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addFabric,
  suggestFabricAttributes,
  type ActionState,
} from "@/app/shop/actions";
import { Field } from "@/components/field";

type Fields = {
  name: string;
  composition: string;
  color: string;
  pattern: string;
};

const EMPTY: Fields = { name: "", composition: "", color: "", pattern: "" };

export function AddFabricForm({ aiEnabled = false }: { aiEnabled?: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addFabric,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [aiJson, setAiJson] = useState("");
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setFields(EMPTY);
      setAiJson("");
      setAiError(null);
      setAiNote(null);
    }
  }, [state.ok]);

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSuggest() {
    setAiError(null);
    setAiNote(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setAiError("Choose a photo first.");
      return;
    }
    setAiPending(true);
    try {
      const fd = new FormData();
      fd.set("photo", file);
      const res = await suggestFabricAttributes({}, fd);
      if (res.error || !res.attrs) {
        setAiError(res.error ?? "No suggestions came back.");
        return;
      }
      const a = res.attrs;
      setFields((prev) => ({
        name: prev.name.trim() || a.name || "",
        composition: a.composition ?? prev.composition,
        color: a.color ?? prev.color,
        pattern: a.pattern ?? prev.pattern,
      }));
      setAiJson(JSON.stringify(a));
      const extra = [a.weave && `weave: ${a.weave}`, a.notes]
        .filter(Boolean)
        .join(" · ");
      setAiNote(
        extra
          ? `Suggested. Review and edit before saving. ${extra}`
          : "Suggested. Review and edit before saving.",
      );
    } catch {
      setAiError("Could not analyze the image.");
    } finally {
      setAiPending(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="card flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">Add a fabric</h2>

      <Field label="Name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          className="input"
          placeholder="Navy wool herringbone"
          value={fields.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Composition" htmlFor="composition">
          <input
            id="composition"
            name="composition"
            className="input"
            placeholder="100% wool"
            value={fields.composition}
            onChange={(e) => set("composition", e.target.value)}
          />
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
          <input
            id="color"
            name="color"
            className="input"
            placeholder="Navy"
            value={fields.color}
            onChange={(e) => set("color", e.target.value)}
          />
        </Field>
        <Field label="Pattern" htmlFor="pattern">
          <input
            id="pattern"
            name="pattern"
            className="input"
            placeholder="Herringbone"
            value={fields.pattern}
            onChange={(e) => set("pattern", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Photo" htmlFor="photo" hint="Becomes the material tile. JPG/PNG, up to 8MB.">
        <input
          ref={fileRef}
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className="input"
          onChange={() => {
            // A new photo invalidates any prior AI proposal.
            setAiJson("");
            setAiError(null);
            setAiNote(null);
          }}
        />
      </Field>

      {/* Carries the full AI proposal (incl. weave/notes) for provenance. */}
      <input type="hidden" name="ai_attributes" value={aiJson} />

      {aiEnabled && (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={aiPending}
            className="btn-secondary self-start"
          >
            {aiPending ? "Analyzing…" : "✨ Suggest from photo"}
          </button>
          {aiNote && <p className="text-xs text-ink-soft">{aiNote}</p>}
          {aiError && <p className="text-sm text-brass">{aiError}</p>}
        </div>
      )}

      {state.error && <p className="text-sm text-brass">{state.error}</p>}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? "Adding…" : "Add fabric"}
      </button>

      <p className="text-xs text-ink-soft">
        {aiEnabled
          ? "AI proposes attributes from the photo — you always confirm before saving."
          : "The photo is used as the material tile. AI attribute suggestions turn on when the deployment has an ANTHROPIC_API_KEY."}
      </p>
    </form>
  );
}
