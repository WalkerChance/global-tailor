import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">404</p>
      <h1 className="mt-3 font-serif text-3xl font-medium">Not found</h1>
      <p className="mt-2 text-ink-soft">
        That page, shop, or order doesn&apos;t exist — or isn&apos;t yours to view.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Back to home
      </Link>
    </div>
  );
}
