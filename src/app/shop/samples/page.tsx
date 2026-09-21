import Link from "next/link";
import type { Metadata } from "next";
import { requireTailor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AddSampleForm } from "@/components/shop/add-sample-form";
import { deleteSample } from "@/app/shop/actions";

export const metadata: Metadata = { title: "Samples" };

export default async function ShopSamplesPage() {
  const ctx = await requireTailor("/shop/samples");
  const supabase = await createClient();

  const [{ data: offered }, { data: samples }] = await Promise.all([
    supabase
      .from("shop_garment_types")
      .select("garment_type_id, garment_types(id, name)")
      .eq("tailor_id", ctx.userId)
      .eq("active", true),
    supabase
      .from("samples")
      .select("id, title, description, media_ids, garment_type_id")
      .eq("tailor_id", ctx.userId)
      .order("created_at", { ascending: false }),
  ]);

  const types = (offered ?? [])
    .map((r) => r.garment_types as unknown as { id: string; name: string } | null)
    .filter((t): t is { id: string; name: string } => !!t);

  // Resolve first-image URLs for the samples in one query.
  const allIds = [...new Set((samples ?? []).flatMap((s) => (s.media_ids as string[]) ?? []))];
  const urlById = new Map<string, string>();
  if (allIds.length > 0) {
    const { data: media } = await supabase
      .from("media")
      .select("id, public_url")
      .in("id", allIds);
    for (const m of media ?? []) if (m.public_url) urlById.set(m.id, m.public_url);
  }

  return (
    <div className="py-10">
      <Link href="/shop" className="font-mono text-xs text-brass">
        ← Console
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Samples</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-soft">
        Your portfolio of finished work. These appear on your public shop page.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <AddSampleForm types={types} />

        <section>
          <h2 className="font-serif text-lg font-semibold">
            Portfolio{" "}
            <span className="font-mono text-xs text-ink-soft">
              ({samples?.length ?? 0})
            </span>
          </h2>
          {!samples || samples.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-soft">
              No samples yet.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {samples.map((s) => {
                const first = ((s.media_ids as string[]) ?? [])[0];
                const url = first ? urlById.get(first) : undefined;
                return (
                  <li key={s.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={s.title} loading="lazy" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="aspect-square w-full bg-surface-2" />
                    )}
                    <div className="flex items-start justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.title}</div>
                      </div>
                      <form action={deleteSample}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          aria-label={`Remove ${s.title}`}
                          className="font-mono text-xs text-ink-soft hover:text-brass"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
