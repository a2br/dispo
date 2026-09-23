"use client";

import { useT } from "@/i18n/client";

/** Links that leave dispo always open in a new tab, marked with an arrow. */
export function ExternalLink({ href, children, className = "link" }: { href: string; children: React.ReactNode; className?: string }) {
  const t = useT();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span aria-hidden className="ml-0.5 text-[0.85em]">↗</span>
      <span className="sr-only"> {t.people.opensInNewTab}</span>
    </a>
  );
}
