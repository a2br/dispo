import Link from "next/link";
import { iconButton } from "@/lib/ui";

/** Back control for subscreens; same size as every other header control. */
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={`Back to ${label}`} title={`Back to ${label}`} className={iconButton("secondary", "sm", "shrink-0 text-lg")}>
      ‹
    </Link>
  );
}
