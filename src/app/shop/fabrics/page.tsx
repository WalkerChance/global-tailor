import Link from "next/link";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";
import { AddFabricForm } from "@/components/shop/add-fabric-form";
import { FabricSwatch } from "@/components/fabric-swatch";
import { deleteFabric } from "@/app/shop/actions";

export const metadata: Metadata = { title: "Fabrics" };

export default async function ShopFabricsPage() {
  const ctx = await requireTailor("/shop/fabrics");
  const supabase = await createClient();

  const { data: fabrics } = await supabase
    .from("fabrics")
    .select(
      "id, name, composition, color, pattern, price_amount, currency, tile:tile_media_id(public_url)",
    )
    .eq("tailor_id", ctx.userId)
    .order("created_at", { ascending: false });

  return (
    <div className="py-10">
      <Link href="/shop" className="font-mono text-xs text-brass">
        ← Console
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Fabrics</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-soft">
        Your material library. Each fabric can be chosen by customers in the
        configurator.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <AddFabricForm />

        <section>
          <h2 className="font-serif text-lg font-semibold">
            Library{" "}
            <span className="font-mono text-xs text-ink-soft">
              ({fabrics?.length ?? 0})
            </span>
          </h2>

          {!fabrics || fabrics.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-soft">
              No fabrics yet. Add your first on the left.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {fabrics.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FabricSwatch
                      url={(f.tile as unknown as { public_url: string } | null)?.public_url}
                      color={f.color}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{f.name}</div>
                      <div className="truncate font-mono text-xs text-ink-soft">
                        {[f.composition, f.color, f.pattern]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm tabular-nums">
                      {formatMoney({
                        amount: f.price_amount,
                        currency: f.currency,
                      })}
                    </span>
                    <form action={deleteFabric}>
                      <input type="hidden" name="id" value={f.id} />
                      <button
                        type="submit"
                        className="font-mono text-xs text-ink-soft hover:text-brass"
                        aria-label={`Remove ${f.name}`}
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
