"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PersonView } from "@/lib/present";
import { setGroupMembersAction } from "@/app/actions";
import { Avatar } from "./Avatar";

type Person = { id: string; name: string; image: string | null };

export function GroupPicker({ friends, selected, week, groupId }: { friends: Person[]; selected: Person[]; week: string | null; groupId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonView[]>([]);
  const seq = useRef(0);
  const term = q.trim();

  const go = (ids: string[]) => {
    if (groupId) {
      // A saved group is open: edit the group itself, then re-render.
      startTransition(async () => {
        await setGroupMembersAction(groupId, ids);
        router.refresh();
      });
      return;
    }
    const params = new URLSearchParams();
    if (ids.length) params.set("with", ids.join(","));
    if (week) params.set("w", week);
    startTransition(() => router.push(`/calendar${params.size ? `?${params}` : ""}`));
  };
  const selectedIds = selected.map((s) => s.id);
  const add = (id: string) => {
    if (!selectedIds.includes(id)) go([...selectedIds, id]);
    setQ("");
    setResults([]);
  };
  const remove = (id: string) => go(selectedIds.filter((x) => x !== id));

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

  const available = friends.filter((f) => !selectedIds.includes(f.id));
  const searchHits = term.length >= 2 ? results.filter((r) => !selectedIds.includes(r.id)) : [];

  return (
    <section className={`rounded-2xl bg-surface border border-line ${pending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-line pl-1 pr-3 py-1 text-sm">
          <span className="size-6 rounded-full bg-foreground text-background grid place-items-center text-[10px] font-semibold">You</span>
          You
        </span>
        {selected.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-background border border-line pl-1 pr-1 py-1 text-sm">
            <Avatar name={p.name} image={p.image} size={24} />
            <span className="max-w-[9rem] truncate">{p.name.split(" ")[0]}</span>
            <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="size-6 grid place-items-center rounded-full text-muted active:bg-line">
              ×
            </button>
          </span>
        ))}
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-sm font-medium text-accent"
        >
          {open ? "Done" : selected.length ? "+ Add" : "+ Add people"}
        </button>
      </div>

      {open && (
        <div className="border-t border-line p-3 space-y-3">
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
            placeholder="Search anyone by name"
            className="w-full rounded-xl bg-background border border-line px-3 py-2 text-base outline-none focus:border-foreground/40"
          />
          {term.length >= 2 ? (
            <PeopleList people={searchHits} onPick={add} empty="No match." />
          ) : available.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-muted uppercase tracking-wide">Your people</div>
              <PeopleList people={available} onPick={add} />
            </>
          ) : (
            <p className="text-sm text-muted">{friends.length === 0 ? "Connect with friends first, or search anyone above." : "Everyone you’re connected with is already added."}</p>
          )}
        </div>
      )}
    </section>
  );
}

function PeopleList({ people, onPick, empty }: { people: Person[]; onPick: (id: string) => void; empty?: string }) {
  if (people.length === 0) return empty ? <p className="text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="flex flex-wrap gap-2">
      {people.map((p) => (
        <li key={p.id}>
          <button onClick={() => onPick(p.id)} className="inline-flex items-center gap-1.5 rounded-full bg-background border border-line pl-1 pr-3 py-1 text-sm active:opacity-70">
            <Avatar name={p.name} image={p.image} size={24} />
            {p.name}
            <span className="text-accent font-semibold">+</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
