import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TailorProfile } from "@/lib/types/database";

async function getShops(): Promise<TailorProfile[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tailor_profiles")
      .select(
        "user_id, shop_name, slug, bio, location_country, location_city, languages, turnaround_days, verification_status, rating_avg",
      )
      .order("shop_name")
      .limit(12);
    return (data as TailorProfile[]) ?? [];
  } catch {
    // Backend not configured yet — render the page shell without shops.
    return [];
  }
}

export default async function Home() {
  const shops = await getShops();

  return (
    <div className="py-10">
      <section className="rounded-2xl border border-line bg-navy px-6 py-12 text-chalk">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
          Bespoke · made to measure
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.02] sm:text-5xl">
          Build a garment <br /> from a tailor{" "}
          <span className="italic text-brass">anywhere</span>.
        </h1>
        <p className="mt-4 max-w-prose text-[15px] text-chalk/75">
          Choose the cloth, the cut, and the options — submit your measurements,
          pick a shipping speed, and order direct from tailors around the world.
        </p>
        <div className="mt-7 flex flex-wrap gap-3 font-mono text-xs">
          <Link
            href="/login"
            className="rounded-full bg-brass px-4 py-2 font-medium text-navy"
          >
            Get started
          </Link>
          <a
            href="#shops"
            className="rounded-full border border-chalk/25 px-4 py-2 text-chalk"
          >
            Browse tailors
          </a>
        </div>
      </section>

      <section id="shops" className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-medium">Tailors</h2>
          <span className="font-mono text-xs text-ink-soft">
            {shops.length > 0 ? `${shops.length} shops` : "Coming soon"}
          </span>
        </div>

        {shops.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line bg-surface p-8 text-center">
            <p className="text-ink-soft">
              No shops yet. Once the database is connected and the first tailor is
              onboarded, their shop appears here.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {shops.map((shop) => (
              <li key={shop.user_id}>
                <Link
                  href={`/tailors/${shop.slug}`}
                  className="block rounded-xl border border-line bg-surface p-5 transition hover:border-brass"
                >
                  <h3 className="font-serif text-lg font-semibold">
                    {shop.shop_name}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    {[shop.location_city, shop.location_country]
                      .filter(Boolean)
                      .join(", ") || "Location —"}
                    {shop.turnaround_days
                      ? ` · ~${shop.turnaround_days}d turnaround`
                      : ""}
                  </p>
                  {shop.bio && (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                      {shop.bio}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
