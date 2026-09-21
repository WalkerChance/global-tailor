import Link from "next/link";
import { getSessionContext, hasRole } from "@/lib/auth";

export async function SiteNav() {
  const ctx = await getSessionContext();

  return (
    <header
      className="sticky z-20 border-b border-line bg-ground/90 backdrop-blur"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-app items-center justify-between px-4 py-3">
        <Link href="/" className="font-serif text-lg font-medium tracking-tight">
          Global <span className="text-brass">Tailor</span>
        </Link>

        <nav className="flex items-center gap-3 font-mono text-xs">
          {ctx ? (
            <>
              <Link href="/account" className="hover:text-brass">
                Account
              </Link>
              {hasRole(ctx, "tailor") && (
                <Link href="/shop" className="hover:text-brass">
                  My shop
                </Link>
              )}
              {hasRole(ctx, "admin") && (
                <Link href="/admin" className="hover:text-brass">
                  Admin
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-line px-3 py-1 hover:text-brass"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-line px-3 py-1 hover:text-brass"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
