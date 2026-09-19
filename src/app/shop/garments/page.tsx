import Link from "next/link";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { centsToInput } from "@/lib/utils";
import { setGarmentType } from "@/app/shop/actions";

export const metadata: Metadata = { title: "Garment types" };

export default async function ShopGarmentsPage() {
  const ctx = await requireTailor("/shop/garments");
  const supabase = await createClient();

  const [{ data: types }, { data: shopRows }] = await Promise.all([
    supabase
      .from("garment_types")
      .select("id, key, name")
      .eq("is_standard", true)
      .order("name"),
    supabase
      .from("shop_garment_types")
      .select("garment_type_id, active, base_price")
      .eq("tailor_id", ctx.userId),
  ]);

  const byType = new Map(
    (shopRows ?? []).map((r) => [r.garment_type_id, r]),
  );

  return (
    <div className="py-10">
      <Link href="/shop" className="font-mono text-xs text-brass">
        ← Console
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Garment types</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-soft">
        Turn on the garments you make and set a base price for each. Base price
        is the starting point; material and options are added on top.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {(types ?? []).map((t) => {
          const row = byType.get(t.id);
          return (
            <form
              key={t.id}
              action={setGarmentType}
              className="card flex flex-wrap items-end gap-4"
            >
              <input type="hidden" name="garment_type_id" value={t.id} />

              <div className="min-w-[8rem] flex-1">
                <div className="font-serif text-lg font-semibold">{t.name}</div>
                <div className="font-mono text-xs text-ink-soft">{t.key}</div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="label">Base price (USD)</span>
                <input
                  name="base_price"
                  type="text"
                  inputMode="decimal"
                  defaultValue={centsToInput(row?.base_price)}
                  placeholder="0.00"
                  className="input w-32"
                />
              </label>

              <label className="flex items-center gap-2 pb-2.5">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={row?.active ?? false}
                  className="h-4 w-4 accent-[var(--brass)]"
                />
                <span className="text-sm">Offered</span>
              </label>

              <button type="submit" className="btn-primary">
                Save
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
