import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";
import { respondMeasurementReview, confirmFit } from "@/app/orders/actions";
import { OrderTimeline } from "@/components/order-timeline";

type Params = { id: string };

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const ctx = await requireUser(`/orders/${id}`);
  const supabase = await createClient();

  // RLS restricts this to the order's customer, its tailor, or an admin.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, customer_id, status, is_test, currency, subtotal, shipping_amount, tax_amount, platform_fee, total, fabric_selections, option_selections, measurement_snapshot, shipping_option_snapshot, created_at, garment_types(name), tailor_profiles(shop_name, slug)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const isCustomer = order.customer_id === ctx.userId;

  const [{ data: shipment }, { data: reviews }, { data: events }] = await Promise.all([
    supabase
      .from("shipments")
      .select("carrier, tracking_number, tracking_url, shipped_at, status")
      .eq("order_id", id)
      .order("created_at", { ascending: false })
      .maybeSingle(),
    supabase
      .from("order_measurement_reviews")
      .select("id, suggested_values, note, status, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("order_events")
      .select("type, created_at")
      .eq("order_id", id)
      .order("created_at"),
  ]);

  const pendingReview = (reviews ?? []).find((r) => r.status === "pending");

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

      {/* Pending measurement adjustment from the tailor */}
      {isCustomer && pendingReview && (
        <section className="card mt-6 border-brass/50">
          <h2 className="font-serif text-base font-semibold">
            Your tailor proposed a measurement adjustment
          </h2>
          {pendingReview.note && (
            <p className="mt-2 text-sm text-ink-soft">{pendingReview.note}</p>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
            {Object.entries(
              (pendingReview.suggested_values as Record<string, string>) ?? {},
            ).map(([k, v]) => (
              <Line key={k} label={k} value={String(v)} />
            ))}
          </dl>
          <div className="mt-4 flex gap-3">
            <form action={respondMeasurementReview}>
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="review_id" value={pendingReview.id} />
              <input type="hidden" name="decision" value="accept" />
              <button className="btn-primary">Accept changes</button>
            </form>
            <form action={respondMeasurementReview}>
              <input type="hidden" name="order_id" value={order.id} />
              <input type="hidden" name="review_id" value={pendingReview.id} />
              <input type="hidden" name="decision" value="decline" />
              <button className="font-mono text-xs text-ink-soft hover:text-brass">
                Keep mine
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Shipment tracking */}
      {shipment && (
        <section className="card mt-4">
          <h2 className="font-serif text-base font-semibold">Shipment</h2>
          <p className="mt-2 text-sm">
            {shipment.carrier ? `${shipment.carrier} · ` : ""}
            <span className="font-mono">{shipment.tracking_number}</span>
          </p>
          {shipment.tracking_url && (
            <a
              href={shipment.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-mono text-xs text-brass"
            >
              Track package →
            </a>
          )}
        </section>
      )}

      {/* Confirm fit */}
      {isCustomer && order.status === "delivered" && (
        <section className="card mt-4 border-brass/50">
          <h2 className="font-serif text-base font-semibold">Did it fit?</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Confirm receipt and fit once your garment arrives.
          </p>
          <form action={confirmFit} className="mt-3">
            <input type="hidden" name="order_id" value={order.id} />
            <button className="btn-primary">Confirm fit</button>
          </form>
        </section>
      )}

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

      {events && events.length > 0 && (
        <section className="card mt-4">
          <h2 className="mb-3 font-serif text-base font-semibold">Progress</h2>
          <OrderTimeline events={events} />
        </section>
      )}

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
