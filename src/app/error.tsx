"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
        Something went wrong
      </p>
      <h1 className="mt-3 font-serif text-3xl font-medium">Unexpected error</h1>
      <p className="mt-2 text-ink-soft">
        We hit a snag loading this page. Try again in a moment.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-6 inline-flex">
        Try again
      </button>
    </div>
  );
}
