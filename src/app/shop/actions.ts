"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
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

  // Optional photo → Storage → media row. The uploaded image is the tile for
  // now; the AI normalization step (ai_status pending→done) comes later.
  let mediaId: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 8 * 1024 * 1024) {
      return { error: "Image is too large (max 8MB)." };
    }
    const path = `${auth.userId}/fabrics/${randomUUID()}`;
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, photo, { contentType: photo.type || "image/jpeg", upsert: false });
    if (upErr) return { error: `Image upload failed: ${upErr.message}` };

    const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
    const { data: media } = await supabase
      .from("media")
      .insert({
        owner_user_id: auth.userId,
        kind: "fabric",
        storage_path: path,
        public_url: pub.publicUrl,
        mime_type: photo.type || null,
        ai_status: "none",
      })
      .select("id")
      .single();
    mediaId = media?.id ?? null;
  }

  const { error } = await supabase.from("fabrics").insert({
    tailor_id: auth.userId,
    name,
    composition: String(formData.get("composition") ?? "").trim() || null,
    color: String(formData.get("color") ?? "").trim() || null,
    pattern: String(formData.get("pattern") ?? "").trim() || null,
    price_amount: priceAmount ?? 0,
    currency: "USD",
    availability: "in_stock",
    source_media_id: mediaId,
    tile_media_id: mediaId,
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

  // Look up the linked media so we can clean up Storage (avoid orphans).
  const { data: fab } = await supabase
    .from("fabrics")
    .select("source_media_id, media:source_media_id(storage_path)")
    .eq("id", id)
    .eq("tailor_id", auth.userId)
    .maybeSingle();

  await supabase.from("fabrics").delete().eq("id", id);

  if (fab?.source_media_id) {
    const path = (fab.media as unknown as { storage_path: string | null } | null)
      ?.storage_path;
    if (path) await supabase.storage.from("media").remove([path]);
    await supabase.from("media").delete().eq("id", fab.source_media_id);
  }

  revalidatePath("/shop/fabrics");
}

// --- Samples (portfolio) --------------------------------------------------

export async function addSample(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireTailorId();
  if ("error" in auth) return auth;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is required." };

  const garmentTypeId = String(formData.get("garment_type_id") ?? "") || null;
  const supabase = await createClient();

  const mediaIds: string[] = [];
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 8 * 1024 * 1024) return { error: "Image is too large (max 8MB)." };
    const path = `${auth.userId}/samples/${randomUUID()}`;
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, photo, { contentType: photo.type || "image/jpeg", upsert: false });
    if (upErr) return { error: `Image upload failed: ${upErr.message}` };
    const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
    const { data: media } = await supabase
      .from("media")
      .insert({
        owner_user_id: auth.userId,
        kind: "sample",
        storage_path: path,
        public_url: pub.publicUrl,
        mime_type: photo.type || null,
        ai_status: "none",
      })
      .select("id")
      .single();
    if (media?.id) mediaIds.push(media.id);
  }

  const { error } = await supabase.from("samples").insert({
    tailor_id: auth.userId,
    garment_type_id: garmentTypeId,
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    media_ids: mediaIds,
  });
  if (error) return { error: error.message };

  revalidatePath("/shop/samples");
  return { ok: true };
}

export async function deleteSample(formData: FormData): Promise<void> {
  const auth = await requireTailorId();
  if ("error" in auth) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: sample } = await supabase
    .from("samples")
    .select("media_ids")
    .eq("id", id)
    .eq("tailor_id", auth.userId)
    .maybeSingle();

  await supabase.from("samples").delete().eq("id", id);

  const ids = (sample?.media_ids as string[]) ?? [];
  if (ids.length > 0) {
    const { data: media } = await supabase
      .from("media")
      .select("id, storage_path")
      .in("id", ids);
    const paths = (media ?? [])
      .map((m) => m.storage_path)
      .filter((p): p is string => !!p);
    if (paths.length > 0) await supabase.storage.from("media").remove(paths);
    await supabase.from("media").delete().in("id", ids);
  }
  revalidatePath("/shop/samples");
}

// --- Options (cuts) -------------------------------------------------------

export async function addOptionGroup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireTailorId();
  if ("error" in auth) return auth;

  const garmentTypeId = String(formData.get("garment_type_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!garmentTypeId) return { error: "Choose a garment type." };
  if (!name) return { error: "Option name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("option_groups").insert({
    tailor_id: auth.userId,
    garment_type_id: garmentTypeId,
    name,
    required: formData.get("required") === "on",
    multi_select: formData.get("multi_select") === "on",
  });
  if (error) return { error: error.message };

  revalidatePath("/shop/options");
  return { ok: true };
}

export async function deleteOptionGroup(formData: FormData): Promise<void> {
  const auth = await requireTailorId();
  if ("error" in auth) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("option_groups").delete().eq("id", id);
  revalidatePath("/shop/options");
}

export async function addOptionValue(formData: FormData): Promise<void> {
  const auth = await requireTailorId();
  if ("error" in auth) return;
  const groupId = String(formData.get("option_group_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!groupId || !name) return;
  const supabase = await createClient();
  await supabase.from("option_values").insert({
    option_group_id: groupId,
    name,
    price_modifier: parseDollarsToCents(formData.get("price_modifier")) ?? 0,
  });
  revalidatePath("/shop/options");
}

export async function deleteOptionValue(formData: FormData): Promise<void> {
  const auth = await requireTailorId();
  if ("error" in auth) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("option_values").delete().eq("id", id);
  revalidatePath("/shop/options");
}

// --- Shipping (flat-rate) -------------------------------------------------

export async function addShippingOption(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const auth = await requireTailorId();
  if ("error" in auth) return auth;

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "A label is required (e.g. “DHL Express”)." };

  const parseDays = (raw: FormDataEntryValue | null): number | null | undefined => {
    const s = String(raw ?? "").trim();
    if (s === "") return null;
    const n = Number(s);
    if (!Number.isInteger(n) || n < 0) return undefined; // invalid
    return n;
  };
  const minDays = parseDays(formData.get("min_days"));
  const maxDays = parseDays(formData.get("max_days"));
  if (minDays === undefined || maxDays === undefined) {
    return { error: "Delivery days must be whole numbers (0 or more)." };
  }
  if (minDays != null && maxDays != null && minDays > maxDays) {
    return { error: "Min days can't exceed max days." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shipping_options").insert({
    tailor_id: auth.userId,
    label,
    carrier: String(formData.get("carrier") ?? "").trim() || null,
    base_price: parseDollarsToCents(formData.get("base_price")) ?? 0,
    additional_item_price: parseDollarsToCents(formData.get("additional_item_price")),
    min_days: minDays,
    max_days: maxDays,
    currency: "USD",
    destination_countries: ["US"],
    active: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/shop/shipping");
  return { ok: true };
}

export async function deleteShippingOption(formData: FormData): Promise<void> {
  const auth = await requireTailorId();
  if ("error" in auth) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("shipping_options").delete().eq("id", id);
  revalidatePath("/shop/shipping");
}
