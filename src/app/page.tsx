import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TailorProfile } from "@/lib/types/database";

type Search = { type?: string; q?: string };

type GarmentType = { id: string; key: string; name: string };

async function loadTypes(): Promise<GarmentType[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("garment_types")
      .select("id, key, name")
      .eq("is_standard", true)
      .order("name");
    return (data as GarmentType[]) ?? [];
  } catch {
    return [];
  }
}

/** Returns null (no constraint) or a set of tailor ids matching the filters. */
async function filteredTailorIds(
  typeId: string | null,
  q: string | null,
): Promise<Set<string> | null> {
  if (!typeId && !q) return null;
  const supabase = await createClient();
  let ids: Set<string> | null = null;

  if (typeId) {
    const { data } = await supabase
      .from("shop_garment_types")
      .select("tailor_id")
      .eq("garment_type_id", typeId)
      .eq("active", true);
    ids = new Set((data ?? []).map((r) => r.tailor_id));
  }

  if (q) {
    const term = q.replace(/[,()*%]/g, " ").trim();
    if (term) {
      const like = `%${term}%`;
      const { data } = await supabase
        .from("fabrics")
        .select("tailor_id")
        .or(
          `name.ilike.${like},composition.ilike.${like},color.ilike.${like},pattern.ilike.${like}`,
        );
      const byMaterial = new Set((data ?? []).map((r) => r.tailor_id));
      ids = ids ? new Set([...ids].filter((x) => byMaterial.has(x))) : byMaterial;
    }
  }

  return ids;
}

async function getShops(ids: Set<string> | null): Promise<TailorProfile[]> {
  try {
    const supabase = await createClient();
    if (ids && ids.size === 0) return [];
    let query = supabase
      .from("tailor_profiles")
      .select(
        "user_id, shop_name, slug, bio, location_country, location_city, languages, turnaround_days, verification_status, rating_avg",
      )
      .order("shop_name")
      .limit(24);
    if (ids) query = query.in("user_id", [...ids]);
    const { data } = await query;
    return (data as TailorProfile[]) ?? [];
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { type, q } = await searchParams;
  const types = await loadTypes();
  const activeType = types.find((t) => t.key === type) ?? null;
  const ids = await filteredTailorIds(activeType?.id ?? null, q ?? null);
  const shops = await getShops(ids);
  const filtering = !!activeType || !!q;

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
          <Link href="/login" className="rounded-full bg-brass px-4 py-2 font-medium text-navy">
            Get started
          </Link>
          <a href="#shops" className="rounded-full border border-chalk/25 px-4 py-2 text-chalk">
            Browse tailors
          </a>
        </div>
      </section>

      <section id="shops" className="mt-12">
        {/* Shop by cut */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
            Shop by cut:
          </span>
          <FilterChip href={buildHref(null, q)} active={!activeType}>
            All
          </FilterChip>
          {types.map((t) => (
            <FilterChip key={t.id} href={buildHref(t.key, q)} active={activeType?.key === t.key}>
              {t.name}
            </FilterChip>
          ))}
        </div>

        {/* Shop by material */}
        <form method="get" className="mt-3 flex flex-wrap items-center gap-2">
          {type && <input type="hidden" name="type" value={type} />}
          <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
            By material:
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="wool, linen, navy…"
            className="input max-w-[220px] py-1.5"
            aria-label="Search materials"
          />
          <button className="rounded-full border border-line px-3 py-1.5 font-mono text-xs hover:text-brass">
            Search
          </button>
          {filtering && (
            <Link href="/" className="font-mono text-xs text-ink-soft hover:text-brass">
              Clear
            </Link>
          )}
        </form>

        <div className="mt-6 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-medium">
            {activeType ? `${activeType.name} makers` : "Tailors"}
          </h2>
          <span className="font-mono text-xs text-ink-soft">
            {shops.length > 0 ? `${shops.length} shops` : "None found"}
          </span>
        </div>

        {shops.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-surface p-8 text-center">
            <p className="text-ink-soft">
              {filtering
                ? "No shops match those filters yet."
                : "No shops yet. Once a tailor is onboarded, their shop appears here."}
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
                  <h3 className="font-serif text-lg font-semibold">{shop.shop_name}</h3>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    {[shop.location_city, shop.location_country].filter(Boolean).join(", ") ||
                      "Location —"}
                    {shop.turnaround_days ? ` · ~${shop.turnaround_days}d turnaround` : ""}
                  </p>
                  {shop.bio && (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{shop.bio}</p>
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

function buildHref(type: string | null, q: string | null | undefined): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (q) params.set("q", q);
  const s = params.toString();
  return s ? `/?${s}#shops` : "/#shops";
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 font-mono text-xs ${
        active ? "border-brass text-brass" : "border-line hover:text-brass"
      }`}
    >
      {children}
    </Link>
  );
}
