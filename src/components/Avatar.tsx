import { initials, toneFor } from "@/lib/present";

export function Avatar({ name, image, size = 40 }: { name: string; image?: string | null; size?: number }) {
  const t = toneFor(name);
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-sm object-cover shrink-0" style={{ width: size, height: size }} />;
  }
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
