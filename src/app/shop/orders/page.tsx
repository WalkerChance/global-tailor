import Link from "next/link";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";

export const metadata: Metadata = { title: "Orders" };

export default async function ShopOrdersPage() {
  const ctx = await requireTailor("/shop/orders");
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, is_test, total, currency, created_at, garment_types(name)")
    .eq("tailor_id", ctx.userId)
    .order("created_at", { ascending: false });

  return (
    <div className="py-10">
      <Link href="/shop" className="font-mono text-xs text-brass">
        ← Console
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Orders</h1>

      {!orders || orders.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-soft">
          No orders yet.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((o) => {
            const gt = o.garment_types as unknown as { name: string } | null;
            return (
              <li key={o.id}>
                <Link
                  href={`/shop/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition hover:border-brass"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {gt?.name ?? "Garment"} · #{o.id.slice(0, 8)}
                    </span>
                    <span className="block font-mono text-xs text-ink-soft">
                      {o.status}
                      {o.is_test ? " · test" : ""} ·{" "}
                      {new Date(o.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="font-mono text-sm tabular-nums">
                    {formatMoney({ amount: o.total, currency: o.currency })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
