/** Renders a fabric's tile image, or a color placeholder when there's no photo. */
export function FabricSwatch({
  url,
  color,
  size = 44,
}: {
  url?: string | null;
  color?: string | null;
  size?: number;
}) {
  const dim = { width: size, height: size };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className="shrink-0 rounded-md object-cover"
        style={dim}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="shrink-0 rounded-md border border-line"
      style={{ ...dim, background: color || "var(--surface-2)" }}
    />
  );
}
