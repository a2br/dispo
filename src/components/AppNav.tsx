"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";

const icon = "size-6 shrink-0";
const IconPeople = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 19c.6-3.2 3.3-5 6.5-5s5.9 1.8 6.5 5" strokeLinecap="round" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16 14.2c2.7.2 4.8 1.7 5.5 4.8" strokeLinecap="round" />
  </svg>
);
const IconClass = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon}>
    <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" strokeLinejoin="round" />
    <path d="M6.5 10.5v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5M21 8.5v5" strokeLinecap="round" />
  </svg>
);
const IconWeek = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
  </svg>
);
const IconMe = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

type Me = { id: string; name: string; email: string; image: string | null };

export function AppNav({ me, classmates = false }: { me: Me; classmates?: boolean }) {
  const path = usePathname();
  const items = [
    { href: "/", label: "People", icon: IconPeople, active: path === "/" || path.startsWith("/u/") },
    { href: "/calendar", label: "Calendar", icon: IconWeek, active: path.startsWith("/calendar") || path.startsWith("/group") },
    ...(classmates ? [{ href: "/classmates", label: "Classes", icon: IconClass, active: path.startsWith("/classmates") || path.startsWith("/course/") }] : []),
    { href: "/me", label: "Settings", icon: IconMe, active: path.startsWith("/me") },
  ];

  return (
    <>
      {/* Tablet / laptop: sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-20 w-60 flex-col border-r border-line bg-surface px-3 py-5">
        <Link href="/" className="flex items-center gap-2.5 px-3 pb-6">
          <span className="size-8 rounded-xl bg-accent grid place-items-center text-white font-black">d</span>
          <span className="text-lg font-bold tracking-tight">dispo</span>
        </Link>
        <nav className="flex-1">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    it.active ? "bg-accent/10 text-accent" : "text-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  {it.icon}
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/me" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-background">
          <Avatar name={me.name} image={me.image} size={32} />
          <span className="min-w-0">
            <span className="block text-sm font-medium truncate">{me.name}</span>
            <span className="block text-xs text-muted truncate">{me.email}</span>
          </span>
        </Link>
      </aside>

      {/* Phone: bottom bar */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-20 bg-surface/95 backdrop-blur border-t border-line safe-bottom">
        <ul className="mx-auto max-w-2xl grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((it) => (
            <li key={it.href}>
              <Link href={it.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${it.active ? "text-accent" : "text-muted"}`}>
                {it.icon}
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
