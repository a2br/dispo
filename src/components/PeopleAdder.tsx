"use client";

import { useEffect, useRef, useState } from "react";
import type { PersonView } from "@/lib/present";
import { input } from "@/lib/ui";
import { useT } from "@/i18n/client";
import { Avatar } from "./Avatar";

type Person = { id: string; name: string };

/**
 * Pick people for a group: your people are listed, anyone else on dispo can be searched.
 * Connections are added directly; everyone else gets an invite they accept or decline.
 * Submits as repeated `member` fields.
 */
export function PeopleAdder({ people, directIds, excludeIds = [] }: { people: Person[]; directIds: string[]; excludeIds?: string[] }) {
  const t = useT().groups.adder;
  const [picked, setPicked] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonView[]>([]);
  const seq = useRef(0);
  const term = q.trim();

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

  const toggle = (p: Person) => setPicked((cur) => (cur.some((x) => x.id === p.id) ? cur.filter((x) => x.id !== p.id) : [...cur, p]));
  const isPicked = (id: string) => picked.some((p) => p.id === id);
  const shown = (term.length >= 2 ? results : [...picked.filter((p) => !people.some((x) => x.id === p.id)), ...people]).filter((p) => !excludeIds.includes(p.id));

  return (
    <div className="border border-line">
      {picked.map((p) => (
        <input key={p.id} type="hidden" name="member" value={p.id} />
      ))}
      <div className="p-2 border-b border-line">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.trim().length < 2) {
              seq.current++;
              setResults([]);
            }
          }}
          placeholder={t.search}
          autoComplete="off"
          className={input("md")}
        />
      </div>
      {shown.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted">{term.length >= 2 ? t.noMatch : t.hint}</p>
      ) : (
        <ul className="divide-y divide-line max-h-80 overflow-y-auto">
          {shown.map((p) => {
            const on = isPicked(p.id);
            const direct = directIds.includes(p.id);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => toggle(p)} aria-pressed={on} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-subtle ${on ? "bg-subtle" : ""}`}>
                  <Avatar name={p.name} size={32} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-bold">{p.name}</span>
                    {on && !direct && <span className="block text-xs text-muted">{t.getsInvite}</span>}
                  </span>
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
  );
}
