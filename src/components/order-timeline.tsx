export type OrderEvent = { type: string; created_at: string };

const LABELS: Record<string, string> = {
  placed: "Order placed",
  "status:accepted": "Accepted by tailor",
  "status:in_production": "In production",
  shipped: "Shipped",
  "status:delivered": "Delivered",
  fit_confirmed: "Fit confirmed",
  measurement_review_proposed: "Measurement adjustment proposed",
  measurement_review_accepted: "Measurement adjustment accepted",
  measurement_review_declined: "Measurement adjustment declined",
};

function label(type: string): string {
  return LABELS[type] ?? type.replace(/[:_]/g, " ");
}

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  if (!events || events.length === 0) return null;
  // Oldest first.
  const ordered = [...events].sort(
    (a, b) => +new Date(a.created_at) - +new Date(b.created_at),
  );

  return (
    <ol className="flex flex-col gap-0">
      {ordered.map((e, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brass" />
            {i < ordered.length - 1 && <span className="w-px flex-1 bg-line" />}
          </div>
          <div className="pb-4">
            <div className="text-sm font-medium">{label(e.type)}</div>
            <div className="font-mono text-xs text-ink-soft">
              {new Date(e.created_at).toLocaleString()}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
