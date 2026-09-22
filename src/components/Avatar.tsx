import { initials, toneFor } from "@/lib/present";

/** Always initials on a name-derived tone; Google profile photos are never shown or stored. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const t = toneFor(name);
  return (
    <div
      aria-hidden
      className="rounded-sm shrink-0 grid place-items-center font-bold"
      style={{ width: size, height: size, fontSize: size * 0.38, background: t.bg, color: t.text }}
    >
      {initials(name)}
    </div>
  );
}
