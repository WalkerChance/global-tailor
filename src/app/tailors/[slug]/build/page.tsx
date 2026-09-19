import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import {
  Configurator,
  type ConfigType,
  type ConfigGroup,
  type ConfigShip,
  type ConfigField,
} from "@/components/configurator";

type Params = { slug: string };

export const metadata: Metadata = { title: "Build a garment" };

export default async function BuildPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const ctx = await getSessionContext();

  const { data: shop } = await supabase
    .from("tailor_profiles")
    .select("user_id, shop_name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!shop) notFound();

  const [{ data: offered }, { data: fabricRows }, { data: groupRows }, { data: shipRows }] =
    await Promise.all([
      supabase
        .from("shop_garment_types")
        .select("base_price, currency, garment_types(id, key, name)")
        .eq("tailor_id", shop.user_id)
        .eq("active", true),
      supabase
        .from("fabrics")
        .select("id, name, composition, color, pattern, price_amount")
        .eq("tailor_id", shop.user_id)
        .order("name"),
      supabase
        .from("option_groups")
        .select("id, name, required, multi_select, garment_type_id, option_values(id, name, price_modifier)")
        .eq("tailor_id", shop.user_id)
        .order("sort"),
      supabase
        .from("shipping_options")
        .select("id, label, carrier, base_price, min_days, max_days")
        .eq("tailor_id", shop.user_id)
        .eq("active", true)
        .order("base_price"),
    ]);

  const types: ConfigType[] = (offered ?? [])
    .map((r) => {
      const gt = r.garment_types as unknown as {
        id: string;
        key: string;
        name: string;
      } | null;
      return gt ? { id: gt.id, key: gt.key, name: gt.name, basePrice: r.base_price } : null;
    })
    .filter((t): t is ConfigType => !!t);

  if (types.length === 0) {
    return (
      <div className="py-16">
        <h1 className="font-serif text-2xl font-medium">{shop.shop_name}</h1>
        <p className="mt-2 text-ink-soft">
          This shop isn&apos;t offering any garments yet.
        </p>
        <Link href={`/tailors/${slug}`} className="mt-6 inline-block font-mono text-xs text-brass">
          ← Back to shop
        </Link>
      </div>
    );
  }

  const typeIds = types.map((t) => t.id);

  const { data: fieldRows } = await supabase
    .from("measurement_fields")
    .select("id, key, label, unit, required, garment_type_id")
    .in("garment_type_id", typeIds)
    .or(`owner_tailor_id.is.null,owner_tailor_id.eq.${shop.user_id}`)
    .order("sort");

  const fabrics = (fabricRows ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    price: f.price_amount,
    meta: [f.composition, f.color, f.pattern].filter(Boolean).join(" · "),
  }));

  const groups: ConfigGroup[] = (groupRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    required: g.required,
    multi_select: g.multi_select,
    garment_type_id: g.garment_type_id,
    values: ((g.option_values as unknown as ConfigGroup["values"]) ?? []).sort(
      (a, b) => a.name.localeCompare(b.name),
    ),
  }));

  const shipping = (shipRows ?? []) as ConfigShip[];
  const fields = (fieldRows ?? []) as ConfigField[];

  // Prefill measurements from the customer's saved profiles (if signed in).
  let prefill: Record<string, Record<string, string>> = {};
  if (ctx) {
    const { data: profiles } = await supabase
      .from("measurement_profiles")
      .select("garment_type_id, values, updated_at")
      .eq("customer_id", ctx.userId)
      .in("garment_type_id", typeIds)
      .order("updated_at", { ascending: false });
    for (const p of profiles ?? []) {
      if (p.garment_type_id && !prefill[p.garment_type_id]) {
        prefill[p.garment_type_id] = (p.values as Record<string, string>) ?? {};
      }
    }
  }

  const currency = (offered?.[0]?.currency as string) ?? "USD";

  return (
    <div className="py-8">
      <Link href={`/tailors/${slug}`} className="font-mono text-xs text-brass">
        ← {shop.shop_name}
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Build your garment</h1>

      <div className="mt-6">
        <Configurator
          tailorId={shop.user_id}
          returnTo={`/tailors/${slug}/build`}
          signedIn={!!ctx}
          currency={currency}
          types={types}
          fabrics={fabrics}
          groups={groups}
          shipping={shipping}
          fields={fields}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
