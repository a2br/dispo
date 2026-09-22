import { hueFor, initials } from "@/lib/present";

export function Avatar({ name, image, size = 40 }: { name: string; image?: string | null; size?: number }) {
  const h = hueFor(name);
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div
      aria-hidden
      className="rounded-full shrink-0 grid place-items-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${h} 60% 88%)`, color: `hsl(${h} 50% 30%)` }}
    >
      {initials(name)}
    </div>
  );
}
