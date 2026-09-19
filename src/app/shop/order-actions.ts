"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, hasRole } from "@/lib/auth";

async function loadTailorOrder(orderId: string) {
  const ctx = await getSessionContext();
  if (!ctx || !hasRole(ctx, "tailor")) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, tailor_id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!data || data.tailor_id !== ctx.userId) return null;
  return { supabase, order: data };
}

function refresh(orderId: string) {
  revalidatePath(`/shop/orders/${orderId}`);
  revalidatePath(`/shop/orders`);
  revalidatePath(`/orders/${orderId}`);
}

// Allowed forward transitions the tailor can drive directly.
const TAILOR_TRANSITIONS: Record<string, string> = {
  accepted: "placed",
  in_production: "accepted",
  delivered: "shipped",
};

export async function setOrderStatus(formData: FormData): Promise<void> {
  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const requiredFrom = TAILOR_TRANSITIONS[status];
  if (!requiredFrom) return;

  const loaded = await loadTailorOrder(orderId);
  if (!loaded) return;
  // Only allow the valid forward transition (no backward/again moves).
  if (loaded.order.status !== requiredFrom) return;

  await loaded.supabase.from("orders").update({ status }).eq("id", orderId);
  await loaded.supabase
    .from("order_events")
    .insert({ order_id: orderId, type: `status:${status}` });
  refresh(orderId);
}

export async function proposeMeasurementReview(formData: FormData): Promise<void> {
  const orderId = String(formData.get("order_id") ?? "");
  const loaded = await loadTailorOrder(orderId);
  if (!loaded) return;

  // Only before the garment ships, and not while a proposal is already pending.
  if (!["placed", "accepted", "in_production"].includes(loaded.order.status)) return;
  const { count: pending } = await loaded.supabase
    .from("order_measurement_reviews")
    .select("*", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("status", "pending");
  if ((pending ?? 0) > 0) return;

  const suggested: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("suggest_")) {
      const val = String(v).trim();
      if (val) suggested[k.slice("suggest_".length)] = val;
    }
  }
  const note = String(formData.get("note") ?? "").trim() || null;

  await loaded.supabase.from("order_measurement_reviews").insert({
    order_id: orderId,
    suggested_values: suggested,
    note,
    status: "pending",
  });
  await loaded.supabase
    .from("order_events")
    .insert({ order_id: orderId, type: "measurement_review_proposed" });
  refresh(orderId);
}

export async function addShipment(formData: FormData): Promise<void> {
  const orderId = String(formData.get("order_id") ?? "");
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();
  if (!trackingNumber) return;

  const loaded = await loadTailorOrder(orderId);
  if (!loaded) return;
  // Only ship from a pre-ship state (prevents duplicate shipments / regressions).
  if (!["placed", "accepted", "in_production"].includes(loaded.order.status)) return;

  await loaded.supabase.from("shipments").insert({
    order_id: orderId,
    carrier: String(formData.get("carrier") ?? "").trim() || null,
    tracking_number: trackingNumber,
    tracking_url: String(formData.get("tracking_url") ?? "").trim() || null,
    shipped_at: new Date().toISOString(),
    status: "shipped",
  });
  await loaded.supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
  await loaded.supabase
    .from("order_events")
    .insert({ order_id: orderId, type: "shipped", payload: { tracking_number: trackingNumber } });
  refresh(orderId);
}
