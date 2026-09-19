import Link from "next/link";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";
import { AddOptionGroupForm } from "@/components/shop/add-option-group-form";
import {
  addOptionValue,
  deleteOptionGroup,
  deleteOptionValue,
} from "@/app/shop/actions";

export const metadata: Metadata = { title: "Options & cuts" };

type OptionValue = { id: string; name: string; price_modifier: number };
type OptionGroup = {
  id: string;
  name: string;
  required: boolean;
  multi_select: boolean;
  garment_type_id: string;
  option_values: OptionValue[];
};

export default async function ShopOptionsPage() {
  const ctx = await requireTailor("/shop/options");
  const supabase = await createClient();

  const [{ data: offered }, { data: groups }] = await Promise.all([
    supabase
      .from("shop_garment_types")
      .select("garment_type_id, garment_types(id, name)")
      .eq("tailor_id", ctx.userId)
      .eq("active", true),
    supabase
      .from("option_groups")
      .select(
        "id, name, required, multi_select, garment_type_id, option_values(id, name, price_modifier)",
      )
      .eq("tailor_id", ctx.userId)
      .order("sort"),
  ]);

  const types = (offered ?? [])
    .map((r) => r.garment_types as unknown as { id: string; name: string } | null)
    .filter((t): t is { id: string; name: string } => !!t);
  const typeName = new Map(types.map((t) => [t.id, t.name]));

  return (
    <div className="py-10">
      <Link href="/shop" className="font-mono text-xs text-brass">
        ← Console
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Options &amp; cuts</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-soft">
        Define the choices customers make when building a garment. Each value can
        add to the price.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <AddOptionGroupForm types={types} />

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-lg font-semibold">
            Groups{" "}
            <span className="font-mono text-xs text-ink-soft">
              ({groups?.length ?? 0})
            </span>
          </h2>

          {!groups || groups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-soft">
              No option groups yet.
            </p>
          ) : (
            (groups as OptionGroup[]).map((g) => (
              <div key={g.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-serif text-base font-semibold">
                      {g.name}
                    </div>
                    <div className="font-mono text-xs text-ink-soft">
                      {typeName.get(g.garment_type_id) ?? "—"}
                      {g.required ? " · required" : ""}
                      {g.multi_select ? " · multiple" : ""}
                    </div>
                  </div>
                  <form action={deleteOptionGroup}>
                    <input type="hidden" name="id" value={g.id} />
                    <button className="font-mono text-xs text-ink-soft hover:text-brass">
                      Delete
                    </button>
                  </form>
                </div>

                <ul className="mt-3 flex flex-col gap-1.5">
                  {g.option_values
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between gap-3 border-t border-line pt-1.5 text-sm first:border-0 first:pt-0"
                      >
                        <span>{v.name}</span>
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-xs text-ink-soft tabular-nums">
                            {v.price_modifier
                              ? `+${formatMoney({ amount: v.price_modifier, currency: "USD" })}`
                              : "included"}
                          </span>
                          <form action={deleteOptionValue}>
                            <input type="hidden" name="id" value={v.id} />
                            <button
                              aria-label={`Remove ${v.name}`}
                              className="font-mono text-xs text-ink-soft hover:text-brass"
                            >
                              ✕
                            </button>
                          </form>
                        </span>
                      </li>
                    ))}
                </ul>

                <form
                  action={addOptionValue}
                  className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3"
                >
                  <input type="hidden" name="option_group_id" value={g.id} />
                  <input
                    name="name"
                    required
                    placeholder="Value (e.g. Peak)"
                    className="input flex-1"
                  />
                  <input
                    name="price_modifier"
                    inputMode="decimal"
                    placeholder="+$"
                    className="input w-24"
                    aria-label="Price add"
                  />
                  <button className="btn-primary">Add</button>
                </form>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
