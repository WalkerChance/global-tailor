import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/account");

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("display_name, phone, shipping_addresses, preferences")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const { count: profileCount } = await supabase
    .from("measurement_profiles")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", ctx.userId);

  const addresses = Array.isArray(customer?.shipping_addresses)
    ? customer!.shipping_addresses.length
    : 0;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, is_test, total, currency, created_at, garment_types(name), tailor_profiles(shop_name)")
    .eq("customer_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
        Customer profile
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium">
        {customer?.display_name || ctx.email}
      </h1>
      <p className="mt-1 font-mono text-xs text-ink-soft">
        Roles: {ctx.roles.join(", ")} ·{" "}
        <Link href="/account/profile" className="text-brass">
          Edit profile →
        </Link>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card title="Contact">
          <Row label="Email" value={ctx.email ?? "—"} />
          <Row label="Phone" value={customer?.phone ?? "Not set"} />
        </Card>
        <Card title="Shipping addresses">
          <Row label="Saved" value={`${addresses} address${addresses === 1 ? "" : "es"}`} />
        </Card>
        <Card title="Measurements">
          <Row
            label="Profiles"
            value={`${profileCount ?? 0} saved`}
          />
          <p className="mt-2 text-xs text-ink-soft">
            Reused across orders — in the order loop you confirm or adjust these,
            not re-enter them.
          </p>
        </Card>
        <Card title="Payment methods">
          <Row label="Saved cards" value="Added in Phase 2 (via Stripe)" />
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-medium">Orders</h2>
        {!orders || orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            No orders yet. Browse tailors from the{" "}
            <Link href="/" className="text-brass">
              home page
            </Link>{" "}
            to build a garment.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {orders.map((o) => {
              const gt = o.garment_types as unknown as { name: string } | null;
              const shop = o.tailor_profiles as unknown as {
                shop_name: string;
              } | null;
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4 transition hover:border-brass"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {gt?.name ?? "Garment"}
                        {shop ? ` · ${shop.shop_name}` : ""}
                      </span>
                      <span className="block font-mono text-xs text-ink-soft">
                        {o.status}
                        {o.is_test ? " · test" : ""} ·{" "}
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="font-mono text-sm tabular-nums">
                      {formatMoney({ amount: o.total, currency: o.currency })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 font-mono text-xs text-ink-soft">
        Profile editing UI is a Phase 1 build item. Preferences and saved cards
        are post-MVP.
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-serif text-base font-semibold">{title}</h2>
      <div className="mt-3 flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}
