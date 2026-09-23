import Link from "next/link";
import { getT } from "@/i18n/server";
import { iconButton } from "@/lib/ui";
import { ChevronLeft } from "./Icons";

/** Back control for subscreens; same size as every other header control. */
export async function BackButton({ href, label }: { href: string; label: string }) {
  const t = await getT();
  return (
    <Link href={href} aria-label={t.pages.backTo(label)} title={t.pages.backTo(label)} className={iconButton("secondary", "sm", "shrink-0")}>
      <ChevronLeft />
    </Link>
  );
}
