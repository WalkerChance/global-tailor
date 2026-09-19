"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, hasRole } from "@/lib/auth";
import { slugify, parseDollarsToCents } from "@/lib/utils";

export type ActionState = { ok?: boolean; error?: string };

async function requireTailorId(): Promise<
  { userId: string } | { error: string }
> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "You must be signed in." };
  if (!hasRole(ctx, "tailor")) return { error: "Requires the tailor role." };
  return { userId: ctx.userId };
}

export async function saveProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireTailorId();
  if ("error" in auth) return auth;

  const shopName = String(formData.get("shop_name") ?? "").trim();
  if (!shopName) return { error: "Shop name is required." };

  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || shopName);
  if (!slug) return { error: "Could not derive a valid shop URL." };

  const turnaroundRaw = String(formData.get("turnaround_days") ?? "").trim();
  const turnaround = turnaroundRaw === "" ? null : Number(turnaroundRaw);
  if (turnaround != null && (!Number.isInteger(turnaround) || turnaround < 0)) {
    return { error: "Turnaround must be a whole number of days." };
  }

  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase.from("tailor_profiles").upsert(
    {
      user_id: auth.userId,
      shop_name: shopName,
      slug,
      bio: String(formData.get("bio") ?? "").trim() || null,
      location_city: String(formData.get("location_city") ?? "").trim() || null,
      location_country:
        String(formData.get("location_country") ?? "").trim() || null,
      turnaround_days: turnaround,
      languages,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That shop URL is taken — choose another."
          : error.message,
    };
  }

  revalidatePath("/shop");
  revalidatePath("/shop/profile");
  revalidatePath(`/tailors/${slug}`);
  return { ok: true };
}

export async function setGarmentType(formData: FormData): Promise<void> {
  const auth = await requireTailorId();
  if ("error" in auth) return;

  const garmentTypeId = String(formData.get("garment_type_id") ?? "");
  if (!garmentTypeId) return;

  const active = formData.get("active") === "on";
  const basePrice = parseDollarsToCents(formData.get("base_price")) ?? 0;

  const supabase = await createClient();
  await supabase.from("shop_garment_types").upsert(
    {
      tailor_id: auth.userId,
      garment_type_id: garmentTypeId,
      active,
      base_price: basePrice,
      currency: "USD",
    },
    { onConflict: "tailor_id,garment_type_id" },
  );

  revalidatePath("/shop/garments");
  revalidatePath("/shop");
}

export async function addFabric(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireTailorId();
  if ("error" in auth) return auth;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Fabric name is required." };

  const priceAmount = parseDollarsToCents(formData.get("price_amount"));

  const supabase = await createClient();
  const { error } = await supabase.from("fabrics").insert({
    tailor_id: auth.userId,
    name,
    composition: String(formData.get("composition") ?? "").trim() || null,
    color: String(formData.get("color") ?? "").trim() || null,
    pattern: String(formData.get("pattern") ?? "").trim() || null,
    price_amount: priceAmount ?? 0,
    currency: "USD",
    availability: "in_stock",
  });

  if (error) return { error: error.message };

  revalidatePath("/shop/fabrics");
  return { ok: true };
}

export async function deleteFabric(formData: FormData): Promise<void> {
  const auth = await requireTailorId();
  if ("error" in auth) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("fabrics").delete().eq("id", id);
  revalidatePath("/shop/fabrics");
}
