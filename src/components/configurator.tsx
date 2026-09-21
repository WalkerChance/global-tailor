"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createOrder, type OrderState } from "@/app/orders/actions";
import { formatMoney } from "@/lib/types/database";
import { FabricSwatch } from "@/components/fabric-swatch";

export type ConfigType = { id: string; key: string; name: string; basePrice: number };
export type ConfigFabric = {
  id: string;
  name: string;
  price: number;
  meta: string;
  image?: string | null;
  color?: string | null;
};
export type ConfigValue = { id: string; name: string; price_modifier: number };
export type ConfigGroup = {
  id: string;
  name: string;
  required: boolean;
  multi_select: boolean;
  garment_type_id: string;
  values: ConfigValue[];
};
export type ConfigShip = {
  id: string;
  label: string;
  carrier: string | null;
  base_price: number;
  min_days: number | null;
  max_days: number | null;
};
export type ConfigField = {
  id: string;
  key: string;
  label: string;
  unit: string;
  required: boolean;
  garment_type_id: string;
};
export type ConfigAddress = { id: string; label: string; summary: string };

export type ConfiguratorProps = {
  tailorId: string;
  returnTo: string;
  signedIn: boolean;
  currency: string;
  types: ConfigType[];
  fabrics: ConfigFabric[];
  groups: ConfigGroup[];
  shipping: ConfigShip[];
  fields: ConfigField[];
  prefill: Record<string, Record<string, string>>;
  addresses: ConfigAddress[];
  defaultAddressId: string | null;
};

export function Configurator(props: ConfiguratorProps) {
  const [state, formAction, pending] = useActionState<OrderState, FormData>(
    createOrder,
    {},
  );

  const [typeId, setTypeId] = useState(props.types[0]?.id ?? "");
  const [fabricId, setFabricId] = useState("");
  const [optionSel, setOptionSel] = useState<Record<string, string[]>>({});
  const [shippingId, setShippingId] = useState("");
  const [addressId, setAddressId] = useState(props.defaultAddressId ?? "");
  const [measures, setMeasures] = useState<Record<string, string>>(
    () => props.prefill[props.types[0]?.id ?? ""] ?? {},
  );

  const type = props.types.find((t) => t.id === typeId);
  const groups = props.groups.filter((g) => g.garment_type_id === typeId);
  const fields = props.fields
    .filter((f) => f.garment_type_id === typeId)
    .sort((a, b) => a.key.localeCompare(b.key));
  const fabric = props.fabrics.find((f) => f.id === fabricId);
  const ship = props.shipping.find((s) => s.id === shippingId);

  function onTypeChange(id: string) {
    setTypeId(id);
    setOptionSel({});
    setMeasures(props.prefill[id] ?? {});
  }

  function toggleOption(group: ConfigGroup, valueId: string) {
    setOptionSel((prev) => {
      const cur = prev[group.id] ?? [];
      if (group.multi_select) {
        return {
          ...prev,
          [group.id]: cur.includes(valueId)
            ? cur.filter((v) => v !== valueId)
            : [...cur, valueId],
        };
      }
      return { ...prev, [group.id]: [valueId] };
    });
  }

  const selectedValueIds = useMemo(
    () => Object.values(optionSel).flat(),
    [optionSel],
  );

  const optionsTotal = useMemo(() => {
    const byId = new Map(
      props.groups.flatMap((g) => g.values.map((v) => [v.id, v.price_modifier])),
    );
    return selectedValueIds.reduce((sum, id) => sum + (byId.get(id) ?? 0), 0);
  }, [selectedValueIds, props.groups]);

  const subtotal =
    (type?.basePrice ?? 0) + (fabric?.price ?? 0) + optionsTotal;
  const total = subtotal + (ship?.base_price ?? 0);

  const missingRequired = groups.filter(
    (g) => g.required && (optionSel[g.id] ?? []).length === 0,
  );
  const missingMeasures = fields.filter(
    (f) => f.required && !(measures[f.key] ?? "").trim(),
  );
  // First unmet requirement (also drives the disabled-button tooltip).
  const blockReason = !fabricId
    ? "Pick a fabric"
    : missingRequired.length > 0
      ? `Choose: ${missingRequired.map((g) => g.name).join(", ")}`
      : missingMeasures.length > 0
        ? `Enter: ${missingMeasures.map((f) => f.label).join(", ")}`
        : !shippingId
          ? "Pick shipping"
          : props.signedIn && !addressId
            ? props.addresses.length === 0
              ? "Add an address in your profile"
              : "Choose an address"
            : "";
  // A delivery address is always required for a signed-in customer to order.
  const canOrder = blockReason === "";

  const money = (amount: number) => formatMoney({ amount, currency: props.currency });

  return (
    <form action={formAction} className="pb-28">
      <input type="hidden" name="tailor_id" value={props.tailorId} />
      <input type="hidden" name="return_to" value={props.returnTo} />
      {/* Selected options submit via hidden inputs (visible controls are
          React-controlled, so single-select groups never collide as one DOM
          radio group). */}
      {selectedValueIds.map((vid) => (
        <input key={vid} type="hidden" name="option_value" value={vid} />
      ))}

      {/* 1. Garment type */}
      <Step n={1} title="Garment">
        <div className="grid gap-3 sm:grid-cols-3">
          {props.types.map((t) => (
            <label
              key={t.id}
              className={`card cursor-pointer ${typeId === t.id ? "border-brass" : ""}`}
            >
              <input
                type="radio"
                name="garment_type_id"
                value={t.id}
                checked={typeId === t.id}
                onChange={() => onTypeChange(t.id)}
                className="sr-only"
              />
              <div className="font-serif text-lg font-semibold">{t.name}</div>
              <div className="font-mono text-xs text-ink-soft">from {money(t.basePrice)}</div>
            </label>
          ))}
        </div>
      </Step>

      {/* 2. Fabric */}
      <Step n={2} title="Material">
        {props.fabrics.length === 0 ? (
          <Empty>No fabrics listed yet.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {props.fabrics.map((f) => (
              <label
                key={f.id}
                className={`flex items-center justify-between gap-3 rounded-xl border bg-surface p-4 ${
                  fabricId === f.id ? "border-brass" : "border-line"
                } cursor-pointer`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="radio"
                    name="fabric_id"
                    value={f.id}
                    checked={fabricId === f.id}
                    onChange={() => setFabricId(f.id)}
                    className="sr-only"
                  />
                  <FabricSwatch url={f.image} color={f.color} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{f.name}</span>
                    <span className="block truncate font-mono text-xs text-ink-soft">
                      {f.meta || "—"}
                    </span>
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums">{money(f.price)}</span>
              </label>
            ))}
          </div>
        )}
      </Step>

      {/* 3. Options */}
      {groups.length > 0 && (
        <Step n={3} title="Options & cuts">
          <div className="flex flex-col gap-5">
            {groups.map((g) => (
              <fieldset key={g.id}>
                <legend className="label mb-2">
                  {g.name}
                  {g.required ? " *" : ""}
                  {g.multi_select ? " (choose any)" : ""}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {g.values.map((v) => {
                    const checked = (optionSel[g.id] ?? []).includes(v.id);
                    return (
                      <label
                        key={v.id}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                          checked ? "border-brass text-brass" : "border-line"
                        }`}
                      >
                        <input
                          type={g.multi_select ? "checkbox" : "radio"}
                          value={v.id}
                          checked={checked}
                          onChange={() => toggleOption(g, v.id)}
                          className="sr-only"
                        />
                        {v.name}
                        {v.price_modifier ? ` +${money(v.price_modifier)}` : ""}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </Step>
      )}

      {/* 4. Measurements — confirm/adjust */}
      <Step n={4} title="Measurements">
        <p className="mb-3 text-sm text-ink-soft">
          Confirm or adjust — prefilled from your saved profile where available.
          The tailor may propose adjustments before cutting.
        </p>
        {fields.length === 0 ? (
          <Empty>No measurement fields for this garment.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <label key={f.id} className="flex flex-col gap-1.5">
                <span className="label">
                  {f.label} <span className="text-ink-soft">({f.unit})</span>
                  {f.required ? " *" : ""}
                </span>
                <input
                  name={`measure_${f.key}`}
                  inputMode="decimal"
                  value={measures[f.key] ?? ""}
                  onChange={(e) =>
                    setMeasures((m) => ({ ...m, [f.key]: e.target.value }))
                  }
                  className="input"
                />
              </label>
            ))}
          </div>
        )}
      </Step>

      {/* 5. Shipping */}
      <Step n={5} title="Shipping">
        {props.shipping.length === 0 ? (
          <Empty>No shipping options listed yet.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {props.shipping.map((s) => (
              <label
                key={s.id}
                className={`flex items-center justify-between gap-3 rounded-xl border bg-surface p-4 ${
                  shippingId === s.id ? "border-brass" : "border-line"
                } cursor-pointer`}
              >
                <span className="min-w-0">
                  <input
                    type="radio"
                    name="shipping_option_id"
                    value={s.id}
                    checked={shippingId === s.id}
                    onChange={() => setShippingId(s.id)}
                    className="sr-only"
                  />
                  <span className="block truncate font-medium">{s.label}</span>
                  <span className="block truncate font-mono text-xs text-ink-soft">
                    {shipWindow(s)}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums">{money(s.base_price)}</span>
              </label>
            ))}
          </div>
        )}
      </Step>

      {/* 6. Ship to */}
      {props.signedIn && (
        <Step n={6} title="Ship to">
          {props.addresses.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-surface p-5 text-sm text-ink-soft">
              No saved address yet. Add one in{" "}
              <a href="/account/profile" className="text-brass">
                your profile
              </a>{" "}
              to place the order.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {props.addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex flex-col gap-0.5 rounded-xl border bg-surface p-4 ${
                    addressId === a.id ? "border-brass" : "border-line"
                  } cursor-pointer`}
                >
                  <input
                    type="radio"
                    name="shipping_address_id"
                    value={a.id}
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                    className="sr-only"
                  />
                  <span className="font-medium">{a.label}</span>
                  <span className="font-mono text-xs text-ink-soft">{a.summary}</span>
                </label>
              ))}
            </div>
          )}
        </Step>
      )}

      {state.error && (
        <p className="mt-4 text-sm text-brass" role="alert">
          {state.error}
        </p>
      )}

      {/* Sticky summary bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ground/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-app items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
              {type?.name ?? "—"} · test order
            </div>
            <div className="font-serif text-xl font-semibold tabular-nums">
              {money(total)}
            </div>
            {props.signedIn && blockReason && (
              <div className="font-mono text-[11px] text-brass">{blockReason}</div>
            )}
          </div>
          {props.signedIn ? (
            <button
              type="submit"
              className="btn-primary"
              disabled={pending || !canOrder}
              title={blockReason || undefined}
            >
              {pending ? "Placing…" : "Place test order"}
            </button>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(props.returnTo)}`}
              className="btn-primary"
            >
              Sign in to order
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}

function shipWindow(s: ConfigShip): string {
  const parts: string[] = [];
  if (s.carrier) parts.push(s.carrier);
  if (s.min_days != null && s.max_days != null) parts.push(`${s.min_days}–${s.max_days} days`);
  else if (s.max_days != null) parts.push(`~${s.max_days} days`);
  return parts.join(" · ") || "—";
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-6 first:border-0">
      <h2 className="mb-4 flex items-baseline gap-3 font-serif text-xl font-medium">
        <span className="font-mono text-xs text-ink-soft">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-surface p-5 text-sm text-ink-soft">
      {children}
    </p>
  );
}
