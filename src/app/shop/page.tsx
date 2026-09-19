import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My shop" };

export default async function ShopConsolePage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/shop");

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
  const [
    { data: profile },
    { count: enabledTypes },
    { count: fabricCount },
    { count: optionCount },
    { count: shippingCount },
  ] = await Promise.all([
    supabase
      .from("tailor_profiles")
      .select("shop_name, slug, verification_status")
      .eq("user_id", ctx.userId)
      .maybeSingle(),
    supabase
      .from("shop_garment_types")
      .select("*", { count: "exact", head: true })
      .eq("tailor_id", ctx.userId)
      .eq("active", true),
    supabase
      .from("fabrics")
      .select("*", { count: "exact", head: true })
      .eq("tailor_id", ctx.userId),
    supabase
      .from("option_groups")
      .select("*", { count: "exact", head: true })
      .eq("tailor_id", ctx.userId),
    supabase
      .from("shipping_options")
      .select("*", { count: "exact", head: true })
      .eq("tailor_id", ctx.userId),
  ]);

  const hasProfile = !!profile;

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
          <Link href={`/tailors/${profile.slug}`} className="hover:text-brass">
            /tailors/{profile.slug}
          </Link>{" "}
          · {profile.verification_status} ·{" "}
          <Link href="/shop/orders" className="text-brass">
            Orders →
          </Link>
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StepCard
          href="/shop/profile"
          title="Shop profile"
          done={hasProfile}
          status={hasProfile ? "Set up" : "Start here"}
          note="Name, story, location, turnaround."
        />
        <StepCard
          href="/shop/garments"
          title="Garment types"
          done={(enabledTypes ?? 0) > 0}
          status={`${enabledTypes ?? 0} offered`}
          note="Enable suits / shirts / pants + base price."
        />
        <StepCard
          href="/shop/fabrics"
          title="Fabrics"
          done={(fabricCount ?? 0) > 0}
          status={`${fabricCount ?? 0} in library`}
          note="Your material library."
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StepCard
          href="/shop/options"
          title="Options & cuts"
          done={(optionCount ?? 0) > 0}
          status={`${optionCount ?? 0} groups`}
          note="Choices customers make, with price add-ons."
        />
        <StepCard
          href="/shop/shipping"
          title="Shipping"
          done={(shippingCount ?? 0) > 0}
          status={`${shippingCount ?? 0} options`}
          note="Flat-rate options you set & quote."
        />
      </div>
    </div>
  );
}

function StepCard({
  href,
  title,
  note,
  done,
  status,
}: {
  href: string;
  title: string;
  note: string;
  done: boolean;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="card block transition hover:border-brass"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-base font-semibold">{title}</h2>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            done ? "text-[var(--brass)]" : "text-ink-soft"
          }`}
        >
          {done ? "✓ " : ""}
          {status}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{note}</p>
    </Link>
  );
}

