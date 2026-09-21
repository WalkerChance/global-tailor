import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CustomerProfileForm } from "@/components/account/profile-form";
import { addAddress, removeAddress, setDefaultAddress, type Address } from "@/app/account/actions";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const ctx = await requireUser("/account/profile");
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("display_name, phone, shipping_addresses, default_address_id")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const addresses = (customer?.shipping_addresses as Address[]) ?? [];
  const defaultId = customer?.default_address_id ?? null;

  return (
    <div className="py-10">
      <Link href="/account" className="font-mono text-xs text-brass">
        ← Account
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-medium">Your profile</h1>

      <div className="mt-8 flex max-w-2xl flex-col gap-6">
        <CustomerProfileForm
          initial={{ display_name: customer?.display_name, phone: customer?.phone }}
        />

        <section className="card">
          <h2 className="font-serif text-lg font-semibold">Shipping addresses</h2>

          {addresses.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">No addresses saved yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {addresses.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-line p-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {a.label}
                      {defaultId === a.id && (
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-brass">
                          default
                        </span>
                      )}
                    </div>
                    <div className="text-ink-soft">
                      {[a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {defaultId !== a.id && (
                      <form action={setDefaultAddress}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="font-mono text-xs text-ink-soft hover:text-brass">
                          set default
                        </button>
                      </form>
                    )}
                    <form action={removeAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        aria-label={`Remove ${a.label}`}
                        className="font-mono text-xs text-ink-soft hover:text-brass"
                      >
                        remove
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form action={addAddress} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="label" placeholder="Label (Home)" className="input" />
              <input name="line1" required placeholder="Address line 1" className="input" />
              <input name="line2" placeholder="Address line 2" className="input" />
              <input name="city" required placeholder="City" className="input" />
              <input name="state" placeholder="State" className="input" />
              <input name="postal_code" placeholder="ZIP / postal" className="input" />
              <input name="country" defaultValue="US" placeholder="Country" className="input" />
            </div>
            <button className="btn-primary self-start">Add address</button>
          </form>
        </section>

        <p className="font-mono text-xs text-ink-soft">
          Preferences and saved payment methods (via Stripe) are post-MVP / Phase 2.
        </p>
      </div>
    </div>
  );
}
