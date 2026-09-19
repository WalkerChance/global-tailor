import { sendOrderMessage } from "@/app/orders/message-actions";

export type ThreadMessage = {
  id: string;
  from_user: string;
  body: string;
  created_at: string;
};

export function MessageThread({
  orderId,
  meId,
  messages,
}: {
  orderId: string;
  meId: string;
  messages: ThreadMessage[];
}) {
  return (
    <section className="card">
      <h2 className="font-serif text-base font-semibold">Messages</h2>

      {messages.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">No messages yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.from_user === meId;
            return (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm ${
                  mine
                    ? "self-end border-brass/40 bg-surface-2"
                    : "self-start border-line bg-surface"
                }`}
              >
                <p>{m.body}</p>
                <p className="mt-1 font-mono text-[10px] text-ink-soft">
                  {mine ? "You" : "Them"} ·{" "}
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <form action={sendOrderMessage} className="mt-4 flex items-end gap-2">
        <input type="hidden" name="order_id" value={orderId} />
        <label className="flex-1">
          <span className="sr-only">Message</span>
          <input
            name="body"
            required
            placeholder="Write a message…"
            className="input"
          />
        </label>
        <button className="btn-primary">Send</button>
      </form>
    </section>
  );
}
