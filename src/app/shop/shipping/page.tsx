import Link from "next/link";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";
import { AddShippingForm } from "@/components/shop/add-shipping-form";
import { deleteShippingOption } from "@/app/shop/actions";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShopShippingPage() {
  const ctx = await requireTailor("/shop/shipping");
  const supabase = await createClient();

  const { data: options } = await supabase
    .from("shipping_options")
    .select(
      "id, label, carrier, base_price, additional_item_price, min_days, max_days, currency",
    )
    .eq("tailor_id", ctx.userId)
    .order("base_price");

  return (
    <div className="py-10">
      <Link href="/shop" className="font-mono text-xs text-brass">
        ← Console
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Shipping</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-soft">
        Flat-rate options you set and quote. Customers pick one at checkout.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <AddShippingForm />

        <section>
          <h2 className="font-serif text-lg font-semibold">
            Your options{" "}
            <span className="font-mono text-xs text-ink-soft">
              ({options?.length ?? 0})
            </span>
          </h2>

          {!options || options.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-soft">
              No shipping options yet.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {options.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.label}</div>
                    <div className="truncate font-mono text-xs text-ink-soft">
                      {[o.carrier, formatWindow(o.min_days, o.max_days)]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                      {o.additional_item_price
                        ? ` · +${formatMoney({ amount: o.additional_item_price, currency: o.currency })}/item`
                        : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm tabular-nums">
                      {formatMoney({ amount: o.base_price, currency: o.currency })}
                    </span>
                    <form action={deleteShippingOption}>
                      <input type="hidden" name="id" value={o.id} />
                      <button
                        aria-label={`Remove ${o.label}`}
                        className="font-mono text-xs text-ink-soft hover:text-brass"
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

function formatWindow(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}–${max} days`;
  if (max != null) return `~${max} days`;
  if (min != null) return `${min}+ days`;
  return "";
}
