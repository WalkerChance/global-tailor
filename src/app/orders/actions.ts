"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { computeOrder } from "@/lib/pricing";

export type OrderState = { error?: string };

/**
 * Places a Phase 1 TEST order (no payment, no tailor engagement).
 * Prices are recomputed authoritatively on the server — never trusted from the
 * client — then the full spec is frozen onto the order.
 */
export async function createOrder(
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  const returnTo = String(formData.get("return_to") ?? "/");

  const ctx = await getSessionContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(returnTo)}`);

  const tailorId = String(formData.get("tailor_id") ?? "");
  const garmentTypeId = String(formData.get("garment_type_id") ?? "");
  const fabricId = String(formData.get("fabric_id") ?? "");
  const shippingId = String(formData.get("shipping_option_id") ?? "");
  const optionValueIds = formData
    .getAll("option_value")
    .map((v) => String(v))
    .filter(Boolean);

  if (!tailorId || !garmentTypeId) return { error: "Pick a garment to build." };
  if (!fabricId) return { error: "Choose a fabric." };
  if (!shippingId) return { error: "Choose a shipping option." };

  const supabase = await createClient();

  // Authoritative base price for this garment type at this shop.
  const { data: sgt } = await supabase
    .from("shop_garment_types")
    .select("base_price, currency, active")
    .eq("tailor_id", tailorId)
    .eq("garment_type_id", garmentTypeId)
    .maybeSingle();
  if (!sgt || !sgt.active) return { error: "That garment isn't offered." };

  // Fabric must belong to this tailor.
  const { data: fabric } = await supabase
    .from("fabrics")
    .select("id, name, price_amount")
    .eq("id", fabricId)
    .eq("tailor_id", tailorId)
    .maybeSingle();
  if (!fabric) return { error: "That fabric isn't available." };

  // Option values must belong to this tailor + this garment type.
  let optionModifiers: number[] = [];
  let optionDetails: { id: string; name: string; price_modifier: number }[] = [];
  if (optionValueIds.length > 0) {
    const { data: values } = await supabase
      .from("option_values")
      .select("id, name, price_modifier, option_groups!inner(tailor_id, garment_type_id)")
      .in("id", optionValueIds);
    const valid = (values ?? []).filter((v) => {
      const g = v.option_groups as unknown as {
        tailor_id: string;
        garment_type_id: string;
      };
      return g?.tailor_id === tailorId && g?.garment_type_id === garmentTypeId;
    });
    optionModifiers = valid.map((v) => v.price_modifier);
    optionDetails = valid.map((v) => ({
      id: v.id,
      name: v.name,
      price_modifier: v.price_modifier,
    }));
  }

  // Shipping option must belong to this tailor.
  const { data: shipping } = await supabase
    .from("shipping_options")
    .select("id, label, carrier, base_price, min_days, max_days")
    .eq("id", shippingId)
    .eq("tailor_id", tailorId)
    .maybeSingle();
  if (!shipping) return { error: "That shipping option isn't available." };

  // Measurements from measure_* fields.
  const measurements: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("measure_")) {
      const v = String(value).trim();
      if (v) measurements[key.slice("measure_".length)] = v;
    }
  }

  const totals = computeOrder({
    basePrice: sgt.base_price,
    fabricPrice: fabric.price_amount,
    optionModifiers,
    shipping: shipping.base_price,
  });

  // Save/refresh a reusable measurement profile for this garment type.
  const { data: existingProfile } = await supabase
    .from("measurement_profiles")
    .select("id")
    .eq("customer_id", ctx.userId)
    .eq("garment_type_id", garmentTypeId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let profileId = existingProfile?.id ?? null;
  if (profileId) {
    await supabase
      .from("measurement_profiles")
      .update({ values: measurements, last_confirmed_at: new Date().toISOString() })
      .eq("id", profileId);
  } else {
    const { data: inserted } = await supabase
      .from("measurement_profiles")
      .insert({
        customer_id: ctx.userId,
        garment_type_id: garmentTypeId,
        label: "Default",
        values: measurements,
        source: "manual",
        last_confirmed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    profileId = inserted?.id ?? null;
  }
  if (profileId) {
    await supabase
      .from("customers")
      .update({ default_measurement_profile_id: profileId })
      .eq("user_id", ctx.userId);
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_id: ctx.userId,
      tailor_id: tailorId,
      garment_type_id: garmentTypeId,
      status: "placed",
      is_test: true,
      fabric_selections: { fabric_id: fabric.id, name: fabric.name },
      option_selections: { values: optionDetails },
      measurement_snapshot: measurements,
      shipping_option_snapshot: {
        id: shipping.id,
        label: shipping.label,
        carrier: shipping.carrier,
        base_price: shipping.base_price,
        min_days: shipping.min_days,
        max_days: shipping.max_days,
      },
      subtotal: totals.subtotal,
      platform_fee: totals.platform_fee,
      shipping_amount: totals.shipping_amount,
      tax_amount: totals.tax_amount,
      total: totals.total,
      currency: sgt.currency ?? "USD",
    })
    .select("id")
    .single();

  if (error || !order) return { error: error?.message ?? "Could not place order." };

  await supabase.from("order_events").insert({
    order_id: order.id,
    type: "placed",
    payload: { is_test: true },
  });

  redirect(`/orders/${order.id}`);
}
