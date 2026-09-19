import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/types/database";
import { FabricSwatch } from "@/components/fabric-swatch";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tailor_profiles")
    .select("shop_name")
    .eq("slug", slug)
    .maybeSingle();
  return { title: data?.shop_name ?? "Tailor" };
}

export default async function TailorPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("tailor_profiles")
    .select(
      "user_id, shop_name, bio, location_city, location_country, languages, turnaround_days",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!shop) notFound();

  const [{ data: offered }, { data: fabrics }, { data: samples }] = await Promise.all([
    supabase
      .from("shop_garment_types")
      .select("base_price, currency, garment_types(key, name)")
      .eq("tailor_id", shop.user_id)
      .eq("active", true),
    supabase
      .from("fabrics")
      .select(
        "id, name, composition, color, pattern, price_amount, currency, tile:tile_media_id(public_url)",
      )
      .eq("tailor_id", shop.user_id)
      .order("name"),
    supabase
      .from("samples")
      .select("id, title, media_ids")
      .eq("tailor_id", shop.user_id)
      .order("created_at", { ascending: false }),
  ]);

  // Resolve sample cover images.
  const sampleIds = [
    ...new Set((samples ?? []).flatMap((s) => (s.media_ids as string[]) ?? [])),
  ];
  const sampleUrl = new Map<string, string>();
  if (sampleIds.length > 0) {
    const { data: media } = await supabase
      .from("media")
      .select("id, public_url")
      .in("id", sampleIds);
    for (const m of media ?? []) if (m.public_url) sampleUrl.set(m.id, m.public_url);
  }

  return (
    <div className="py-10">
      <Link href="/" className="font-mono text-xs text-brass">
        ← All tailors
      </Link>

      <header className="mt-4">
        <h1 className="font-serif text-4xl font-medium">{shop.shop_name}</h1>
        <p className="mt-1 font-mono text-xs text-ink-soft">
          {[shop.location_city, shop.location_country].filter(Boolean).join(", ") ||
            "Location —"}
          {shop.turnaround_days ? ` · ~${shop.turnaround_days}d turnaround` : ""}
          {shop.languages?.length ? ` · ${shop.languages.join(", ")}` : ""}
        </p>
        {shop.bio && <p className="mt-4 max-w-prose text-ink-soft">{shop.bio}</p>}
      </header>

      {samples && samples.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-medium">Portfolio</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {samples.map((s) => {
              const first = ((s.media_ids as string[]) ?? [])[0];
              const url = first ? sampleUrl.get(first) : undefined;
              if (!url) return null;
              return (
                <li key={s.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={s.title} loading="lazy" className="aspect-square w-full object-cover" />
                  <div className="truncate p-2 text-xs">{s.title}</div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-medium">What they make</h2>
        {!offered || offered.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No garments listed yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {offered.map((row, i) => {
              const gt = row.garment_types as unknown as {
                key: string;
                name: string;
              } | null;
              return (
                <li key={i} className="card">
                  <div className="font-serif text-lg font-semibold">
                    {gt?.name ?? "Garment"}
                  </div>
                  <div className="mt-1 font-mono text-xs text-ink-soft">
                    from{" "}
                    {formatMoney({
                      amount: row.base_price,
                      currency: row.currency,
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-medium">Fabrics</h2>
        {!fabrics || fabrics.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No fabrics listed yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {fabrics.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FabricSwatch
                    url={(f.tile as unknown as { public_url: string } | null)?.public_url}
                    color={f.color}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{f.name}</div>
                    <div className="truncate font-mono text-xs text-ink-soft">
                      {[f.composition, f.color, f.pattern].filter(Boolean).join(" · ") ||
                        "—"}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-sm tabular-nums">
                  {formatMoney({ amount: f.price_amount, currency: f.currency })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {offered && offered.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-3 rounded-xl border border-line bg-surface p-8 text-center">
          <p className="max-w-prose text-sm text-ink-soft">
            Pick a garment, choose fabric and options, confirm your measurements,
            and place an order.
          </p>
          <Link href={`/tailors/${slug}/build`} className="btn-primary">
            Build your garment
          </Link>
        </div>
      )}
    </div>
  );
}
