"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import { Wordmark } from "./Wordmark";

const icon = "size-6 shrink-0";
const IconNow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconMe = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon}>
    <path d="M12 3 22.5 8.5 12 14 1.5 8.5 12 3Z" strokeLinejoin="round" />
    <path d="M5.5 11v5.2c0 2 2.9 4.3 6.5 4.3s6.5-2.3 6.5-4.3V11M22.5 8.5v7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconWeek = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
  </svg>
);

type Me = { id: string; name: string; email: string };

export function AppNav({ me }: { me: Me }) {
  const path = usePathname();
  const items = [
    { href: "/", label: "Now", icon: IconNow, active: path === "/" || path.startsWith("/u/") || path.startsWith("/groups") || path.startsWith("/discover") || path.startsWith("/classmates") || path.startsWith("/course/") },
    { href: "/calendar", label: "Calendar", icon: IconWeek, active: path.startsWith("/calendar") || path === "/group" },
  ];
  const meActive = path.startsWith("/me") || path.startsWith("/setup");

  return (
    <>
      {/* Tablet / laptop: sidebar */}
      <aside className="hidden md:flex fixed top-4 left-4 z-20 w-56 flex-col border border-line bg-surface py-4">
        <Link href="/" className="block px-4 pb-4">
          <Wordmark size="text-2xl" />
        </Link>
        <nav className="pb-3">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={it.active ? "page" : undefined}
                  className={`relative flex items-center gap-3 px-4 py-2.5 text-[15px] font-bold transition-colors duration-150 ${
                    it.active ? "bg-subtle text-accent-ink" : "text-foreground hover:bg-subtle hover:text-accent-ink"
                  }`}
                >
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] bg-accent transition-transform duration-200 origin-center ${it.active ? "scale-y-100" : "scale-y-0"}`} />
                  {it.icon}
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/me"
          aria-current={meActive ? "page" : undefined}
          className={`relative flex items-center gap-3 px-4 py-2.5 border-t border-line transition-colors duration-150 ${meActive ? "bg-subtle" : "hover:bg-subtle"}`}
        >
          <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] bg-accent transition-transform duration-200 ${meActive ? "scale-y-100" : "scale-y-0"}`} />
          <Avatar name={me.name} size={32} />
          <span className="min-w-0 flex-1">
            <span className={`block text-sm font-bold truncate ${meActive ? "text-accent-ink" : ""}`}>{me.name}</span>
            <span className="block text-xs text-muted truncate">Profile & settings</span>
          </span>
        </Link>
      </aside>

      {/* Phone: bottom bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-20 bg-background/95 backdrop-blur border-t border-line safe-bottom">
        <ul className="mx-auto max-w-2xl grid grid-cols-3">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={it.active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold transition-colors duration-150 ${it.active ? "text-accent-ink" : "text-muted"}`}
              >
                <span aria-hidden className={`absolute top-0 inset-x-6 h-0.5 bg-accent transition-transform duration-200 ${it.active ? "scale-x-100" : "scale-x-0"}`} />
                {it.icon}
                {it.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/me"
              aria-current={meActive ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold transition-colors duration-150 ${meActive ? "text-accent-ink" : "text-muted"}`}
            >
              <span aria-hidden className={`absolute top-0 inset-x-6 h-0.5 bg-accent transition-transform duration-200 ${meActive ? "scale-x-100" : "scale-x-0"}`} />
              {IconMe}
              Me
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
