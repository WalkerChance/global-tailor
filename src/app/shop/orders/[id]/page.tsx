import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";
import {
  setOrderStatus,
  proposeMeasurementReview,
  addShipment,
} from "@/app/shop/order-actions";
import { OrderTimeline } from "@/components/order-timeline";
import { MessageThread } from "@/components/message-thread";

type Params = { id: string };

export const metadata: Metadata = { title: "Order" };

export default async function TailorOrderPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const ctx = await requireTailor(`/shop/orders/${id}`);
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, tailor_id, status, is_test, currency, total, fabric_selections, option_selections, measurement_snapshot, shipping_option_snapshot, shipping_address, created_at, garment_types(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order || order.tailor_id !== ctx.userId) notFound();

  const [{ data: shipment }, { data: reviews }, { data: events }, { data: messages }] =
    await Promise.all([
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
      supabase
        .from("messages")
        .select("id, from_user, body, created_at")
        .eq("order_id", id)
        .order("created_at"),
    ]);

  const gt = order.garment_types as unknown as { name: string } | null;
  const fabric = order.fabric_selections as { name?: string } | null;
  const options =
    (order.option_selections as { values?: { name: string }[] } | null)?.values ?? [];
  const measures = (order.measurement_snapshot as Record<string, string>) ?? {};
  const ship = order.shipping_option_snapshot as { label?: string } | null;
  const addr = order.shipping_address as {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;
  const addrLine = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
        .filter(Boolean)
        .join(", ")
    : null;
  const status = order.status;
  const hasPendingReview = (reviews ?? []).some((r) => r.status === "pending");
  const canProposeAdjustment =
    ["placed", "accepted", "in_production"].includes(status) && !hasPendingReview;

  return (
    <div className="py-10">
      <Link href="/shop/orders" className="font-mono text-xs text-brass">
        ← Orders
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">
        {gt?.name ?? "Garment"} · #{order.id.slice(0, 8)}
      </h1>
      <p className="mt-1 font-mono text-xs text-ink-soft">
        {status}
        {order.is_test ? " · test order" : ""} ·{" "}
        {formatMoney({ amount: order.total, currency: order.currency })}
      </p>

      {/* Status actions */}
      <section className="card mt-6">
        <h2 className="font-serif text-base font-semibold">Fulfilment</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {status === "placed" && (
            <StatusButton orderId={order.id} status="accepted" label="Accept order" />
          )}
          {status === "accepted" && (
            <StatusButton orderId={order.id} status="in_production" label="Mark in production" />
          )}
          {status === "shipped" && (
            <StatusButton orderId={order.id} status="delivered" label="Mark delivered" />
          )}
          {["placed", "accepted", "in_production"].includes(status) && (
            <span className="font-mono text-xs text-ink-soft">
              Add tracking below to mark shipped.
            </span>
          )}
          {status === "delivered" && (
            <span className="font-mono text-xs text-ink-soft">
              Waiting on the customer to confirm fit.
            </span>
          )}
          {status === "fit_confirmed" && (
            <span className="font-mono text-xs text-brass">Fit confirmed ✓</span>
          )}
        </div>

        {shipment && (
          <p className="mt-3 font-mono text-xs text-ink-soft">
            Shipped via {shipment.carrier ?? "carrier"} · {shipment.tracking_number}
          </p>
        )}

        {["placed", "accepted", "in_production"].includes(status) && (
          <form action={addShipment} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
            <input type="hidden" name="order_id" value={order.id} />
            <label className="flex flex-col gap-1.5">
              <span className="label">Carrier</span>
              <input name="carrier" placeholder="DHL" className="input w-28" />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="label">Tracking number</span>
              <input name="tracking_number" required className="input" />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="label">Tracking URL</span>
              <input name="tracking_url" className="input" placeholder="https://…" />
            </label>
            <button className="btn-primary">Mark shipped</button>
          </form>
        )}
      </section>

      {/* Spec */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="card">
          <h2 className="font-serif text-base font-semibold">Specification</h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Line label="Fabric" value={fabric?.name ?? "—"} />
            <Line label="Options" value={options.length ? options.map((o) => o.name).join(", ") : "None"} />
            <Line label="Shipping" value={ship?.label ?? "—"} />
            {addrLine && <Line label="Ship to" value={addrLine} />}
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

      {/* Propose measurement adjustment */}
      <section className="card mt-4">
        <h2 className="font-serif text-base font-semibold">
          Propose a measurement adjustment
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Suggest changes before cutting. The customer accepts or declines.
        </p>
        {canProposeAdjustment ? (
          <form action={proposeMeasurementReview} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="order_id" value={order.id} />
            {Object.keys(measures).length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(measures).map(([k, v]) => (
                  <label key={k} className="flex flex-col gap-1.5">
                    <span className="label">{k}</span>
                    <input name={`suggest_${k}`} defaultValue={String(v)} className="input" />
                  </label>
                ))}
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="label">Note to customer</span>
              <textarea name="note" className="textarea" placeholder="Why the adjustment…" />
            </label>
            <button className="btn-primary self-start">Send proposal</button>
          </form>
        ) : (
          <p className="mt-3 font-mono text-xs text-ink-soft">
            {hasPendingReview
              ? "A proposal is awaiting the customer's response."
              : "Adjustments can only be proposed before the garment ships."}
          </p>
        )}

        {reviews && reviews.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
            {reviews.map((r) => (
              <li key={r.id} className="text-sm">
                <span className="font-mono text-xs text-ink-soft">
                  {new Date(r.created_at).toLocaleDateString()} · {r.status}
                </span>
                {r.note && <span className="ml-2">{r.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {events && events.length > 0 && (
        <section className="card mt-4">
          <h2 className="mb-3 font-serif text-base font-semibold">Progress</h2>
          <OrderTimeline events={events} />
        </section>
      )}

      <div className="mt-4">
        <MessageThread orderId={order.id} meId={ctx.userId} messages={messages ?? []} />
      </div>
    </div>
  );
}

function StatusButton({
  orderId,
  status,
  label,
}: {
  orderId: string;
  status: string;
  label: string;
}) {
  return (
    <form action={setOrderStatus}>
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <button className="btn-primary">{label}</button>
    </form>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
