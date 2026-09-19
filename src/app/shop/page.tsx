import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My shop" };

export default async function ShopConsolePage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/shop");

  // Role gate: tailor console requires the tailor role.
  if (!hasRole(ctx, "tailor")) {
    return (
      <div className="py-16">
        <h1 className="font-serif text-2xl font-medium">Become a tailor</h1>
        <p className="mt-2 max-w-prose text-ink-soft">
          Your account doesn&apos;t have the <code className="font-mono">tailor</code>{" "}
          role yet. In Phase 1, tailor onboarding is concierge — an admin grants
          the role and helps set up the shop.
        </p>
        <Link href="/account" className="mt-6 inline-block font-mono text-xs text-brass">
          ← Back to account
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("tailor_profiles")
    .select("shop_name, slug, verification_status")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
        Tailor console
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium">
        {profile?.shop_name ?? "Set up your shop"}
      </h1>
      {profile && (
        <p className="mt-1 font-mono text-xs text-ink-soft">
          /{profile.slug} · {profile.verification_status}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Task title="Shop profile" note="Name, story, location, turnaround." />
        <Task title="Garment types" note="Enable suits / shirts / pants." />
        <Task title="Fabrics & tiles" note="Upload materials → AI tile → confirm." />
        <Task title="Options & pricing" note="Cuts, options, type→material pricing." />
        <Task title="Shipping" note="Flat-rate options you set & quote." />
        <Task title="Orders" note="Incoming test orders (Phase 1)." />
      </div>

      <p className="mt-8 font-mono text-xs text-ink-soft">
        These editors are the Phase 1 build. This page confirms the tailor role
        gate and RLS scoping work.
      </p>
    </div>
  );
}

function Task({ title, note }: { title: string; note: string }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-serif text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{note}</p>
      <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-wider text-brass">
        To build
      </span>
    </section>
  );
}
