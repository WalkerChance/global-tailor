"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

export type ProfileState = { ok?: boolean; error?: string };

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

async function currentCustomer() {
  const ctx = await getSessionContext();
  if (!ctx) return null;
  const supabase = await createClient();
  return { userId: ctx.userId, supabase };
}

export async function saveCustomerProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const cur = await currentCustomer();
  if (!cur) return { error: "Sign in required." };

  const { error } = await cur.supabase
    .from("customers")
    .update({
      display_name: String(formData.get("display_name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
    })
    .eq("user_id", cur.userId);

  if (error) return { error: error.message };
  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true };
}

export async function addAddress(formData: FormData): Promise<void> {
  const cur = await currentCustomer();
  if (!cur) return;

  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!line1 || !city) return;

  const address: Address = {
    id: randomUUID(),
    label: String(formData.get("label") ?? "").trim() || "Home",
    line1,
    line2: String(formData.get("line2") ?? "").trim() || undefined,
    city,
    state: String(formData.get("state") ?? "").trim(),
    postal_code: String(formData.get("postal_code") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim() || "US",
  };

  const { data } = await cur.supabase
    .from("customers")
    .select("shipping_addresses, default_address_id")
    .eq("user_id", cur.userId)
    .maybeSingle();

  const list = (data?.shipping_addresses as Address[]) ?? [];
  const next = [...list, address];
  await cur.supabase
    .from("customers")
    .update({
      shipping_addresses: next,
      // First address added becomes the default.
      default_address_id: data?.default_address_id ?? address.id,
    })
    .eq("user_id", cur.userId);

  revalidatePath("/account/profile");
}

export async function removeAddress(formData: FormData): Promise<void> {
  const cur = await currentCustomer();
  if (!cur) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data } = await cur.supabase
    .from("customers")
    .select("shipping_addresses, default_address_id")
    .eq("user_id", cur.userId)
    .maybeSingle();

  const list = ((data?.shipping_addresses as Address[]) ?? []).filter(
    (a) => a.id !== id,
  );
  const nextDefault =
    data?.default_address_id === id ? (list[0]?.id ?? null) : data?.default_address_id;

  await cur.supabase
    .from("customers")
    .update({ shipping_addresses: list, default_address_id: nextDefault })
    .eq("user_id", cur.userId);

  revalidatePath("/account/profile");
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  const cur = await currentCustomer();
  if (!cur) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await cur.supabase
    .from("customers")
    .update({ default_address_id: id })
    .eq("user_id", cur.userId);
  revalidatePath("/account/profile");
}
