import Link from "next/link";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm, type ProfileInitial } from "@/components/shop/profile-form";

export const metadata: Metadata = { title: "Shop profile" };

export default async function ShopProfilePage() {
  const ctx = await requireTailor("/shop/profile");
  const supabase = await createClient();

  const { data } = await supabase
    .from("tailor_profiles")
    .select(
      "shop_name, slug, bio, location_city, location_country, turnaround_days, languages",
    )
    .eq("user_id", ctx.userId)
    .maybeSingle();

  return (
    <div className="py-10">
      <Link href="/shop" className="font-mono text-xs text-brass">
        ← Console
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Shop profile</h1>
      <p className="mt-1 text-sm text-ink-soft">
        This is what customers see first. You can edit it any time.
      </p>

      <div className="mt-8 max-w-xl">
        <ProfileForm initial={(data ?? {}) as ProfileInitial} />
      </div>
    </div>
  );
}
