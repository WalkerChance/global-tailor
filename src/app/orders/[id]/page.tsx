import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";

type Params = { id: string };

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  await requireUser(`/orders/${id}`);
  const supabase = await createClient();

  // RLS restricts this to the order's customer, its tailor, or an admin.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, is_test, currency, subtotal, shipping_amount, tax_amount, platform_fee, total, fabric_selections, option_selections, measurement_snapshot, shipping_option_snapshot, created_at, garment_types(name), tailor_profiles(shop_name, slug)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const gt = order.garment_types as unknown as { name: string } | null;
  const shop = order.tailor_profiles as unknown as {
    shop_name: string;
    slug: string;
  } | null;
  const fabric = order.fabric_selections as { name?: string } | null;
  const options =
    (order.option_selections as { values?: { name: string; price_modifier: number }[] } | null)
      ?.values ?? [];
  const measures = (order.measurement_snapshot as Record<string, string>) ?? {};
  const ship = order.shipping_option_snapshot as { label?: string } | null;
  const money = (a: number) => formatMoney({ amount: a, currency: order.currency });

  return (
    <div className="py-10">
      {order.is_test && (
        <div className="mb-6 rounded-xl border border-brass/50 bg-surface-2 px-4 py-3 font-mono text-xs text-brass">
          TEST ORDER · Phase 1 UI validation — no payment was taken and the tailor
          is not engaged.
        </div>
      )}

      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
        Order placed · {order.status}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium">
        {gt?.name ?? "Garment"}
        {shop && (
          <span className="text-ink-soft">
            {" "}
            from{" "}
            <Link href={`/tailors/${shop.slug}`} className="hover:text-brass">
              {shop.shop_name}
            </Link>
          </span>
        )}
      </h1>
      <p className="mt-1 font-mono text-xs text-ink-soft">
        #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="card">
          <h2 className="font-serif text-base font-semibold">Specification</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Line label="Fabric" value={fabric?.name ?? "—"} />
            <Line
              label="Options"
              value={options.length ? options.map((o) => o.name).join(", ") : "None"}
            />
            <Line label="Shipping" value={ship?.label ?? "—"} />
          </dl>
        </section>

        <section className="card">
          <h2 className="font-serif text-base font-semibold">Measurements</h2>
          {Object.keys(measures).length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">None recorded.</p>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {Object.entries(measures).map(([k, v]) => (
                <Line key={k} label={k} value={String(v)} />
              ))}
            </dl>
          )}
        </section>
      </div>

      <section className="card mt-4">
        <h2 className="font-serif text-base font-semibold">Total</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <Line label="Subtotal" value={money(order.subtotal)} />
          <Line label="Shipping" value={money(order.shipping_amount)} />
          {order.tax_amount > 0 && <Line label="Tax" value={money(order.tax_amount)} />}
          <div className="mt-1 flex items-baseline justify-between border-t border-line pt-2 font-semibold">
            <span>Total</span>
            <span className="font-mono tabular-nums">{money(order.total)}</span>
          </div>
        </dl>
      </section>

      <div className="mt-8 flex gap-4">
        <Link href="/account" className="font-mono text-xs text-brass">
          ← Account
        </Link>
        {shop && (
          <Link href={`/tailors/${shop.slug}/build`} className="font-mono text-xs text-brass">
            Build another →
          </Link>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
