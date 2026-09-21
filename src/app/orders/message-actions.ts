"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

/**
 * Sends a message on an order. The recipient is the other party (customer↔tailor).
 * RLS requires from_user = auth.uid(); we also verify the sender is a party.
 */
export async function sendOrderMessage(formData: FormData): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx) return;

  const orderId = String(formData.get("order_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!orderId || !body) return;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("customer_id, tailor_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  let toUser: string | null = null;
  if (ctx.userId === order.customer_id) toUser = order.tailor_id;
  else if (ctx.userId === order.tailor_id) toUser = order.customer_id;
  if (!toUser) return; // not a party

  await supabase.from("messages").insert({
    order_id: orderId,
    from_user: ctx.userId,
    to_user: toUser,
    body,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/shop/orders/${orderId}`);
}
