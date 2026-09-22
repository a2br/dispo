"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PersonView } from "@/lib/present";
import { button, chip, iconButton, input } from "@/lib/ui";
import { Avatar } from "./Avatar";

type Person = { id: string; name: string; image: string | null };
export type PickerGroup = { id: string; name: string; memberIds: string[] };

/**
 * Chooses who is on the calendar — nothing else. The view lives in the URL (?with=).
 * "+ People" opens one list: search, your groups (tap to show one), your people (tap to toggle).
 */
export function PeoplePicker({ friends, selected, groups, week }: { friends: Person[]; selected: Person[]; groups: PickerGroup[]; week: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonView[]>([]);
  const seq = useRef(0);
  const term = q.trim();
  const selectedIds = selected.map((s) => s.id);

  const hrefFor = (ids: string[]) => {
    const params = new URLSearchParams();
    if (ids.length) params.set("with", ids.join(","));
    if (week) params.set("w", week);
    return `/calendar${params.size ? `?${params}` : ""}`;
  };
  const go = (ids: string[]) => startTransition(() => router.push(hrefFor(ids)));
  const toggle = (id: string) => go(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  useEffect(() => {
    if (term.length < 2) return;
    const my = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&directory=0`);
        const data = (await res.json()) as { people: PersonView[] };
        if (my === seq.current) setResults(data.people);
      } catch {
        if (my === seq.current) setResults([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [term]);

  // Everyone in the view is listed too (e.g. group-mates you're not connected with), so any of them can be toggled off.
  const rows = term.length >= 2 ? results : [...selected.filter((p) => !friends.some((f) => f.id === p.id)), ...friends];

  return (
    <section className={`transition-opacity duration-150 ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={chip("pl-1")}>
          <span className="size-5 rounded-sm bg-foreground" aria-hidden />
          You
        </span>
        {selected.map((p) => (
          <span key={p.id} className={chip("pl-1 pr-0.5 animate-in")}>
            <Avatar name={p.name} image={p.image} size={20} />
            <span className="max-w-[9rem] truncate">{p.name.split(" ")[0]}</span>
            <button onClick={() => toggle(p.id)} aria-label={`Remove ${p.name} from the view`} className={iconButton("quiet", "sm", "size-7")}>
              ×
            </button>
          </span>
        ))}
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={button(open ? "dark" : "add")}>
          {open ? "Done" : "+ People"}
        </button>
        {selected.length > 0 && !open && (
          <Link href={hrefFor([])} className={button("quiet")}>
            Clear
          </Link>
        )}
      </div>

      {open && (
        <div className="mt-2 border border-line bg-surface animate-in max-h-[55dvh] overflow-y-auto">
          <div className="p-2 border-b border-line sticky top-0 bg-surface">
            <input
              type="search"
              value={q}
              autoFocus
              onChange={(e) => {
                setQ(e.target.value);
                if (e.target.value.trim().length < 2) {
                  seq.current++;
                  setResults([]);
                }
              }}
              placeholder="Search anyone by name"
              className={input("md")}
            />
          </div>

          {term.length < 2 && groups.length > 0 && (
            <>
              <div className="px-4 pt-3 pb-1 text-xs font-bold text-muted uppercase tracking-wide">Groups</div>
              <ul>
                {groups.map((g) => (
                  <li key={g.id}>
                    <Link href={hrefFor(g.memberIds)} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-subtle">
                      <span className="size-8 shrink-0 rounded-sm bg-subtle border border-line grid place-items-center text-sm" aria-hidden>
                        ★
                      </span>
                      <span className="flex-1 min-w-0 truncate font-bold">{g.name}</span>
                      <span className="text-xs text-muted">{g.memberIds.length + 1} people</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="px-4 pt-3 pb-1 text-xs font-bold text-muted uppercase tracking-wide">{term.length >= 2 ? "Results" : "Your people"}</div>
          {rows.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted">{term.length >= 2 ? "No match." : "Nobody yet. Search anyone above."}</p>
          ) : (
            <ul className="pb-1">
              {rows.map((p) => {
                const on = selectedIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <button onClick={() => toggle(p.id)} aria-pressed={on} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-subtle">
                      <Avatar name={p.name} image={p.image} size={32} />
                      <span className="flex-1 min-w-0 truncate font-bold">{p.name}</span>
                      <span className={`size-5 rounded-sm border grid place-items-center text-xs ${on ? "bg-foreground border-foreground text-background" : "border-line-strong"}`} aria-hidden>
                        {on ? "✓" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
