"use client";

import { useEffect, useRef, useState } from "react";
import type { PersonView } from "@/lib/present";
import type { DirectoryPerson } from "@/lib/directory";
import { Avatar } from "./Avatar";
import { input } from "@/lib/ui";
import { InviteButton } from "./InviteButton";
import { ExternalLink } from "./ExternalLink";
import { PersonRow } from "./PersonRow";

export function SearchBox({ autoFocus = false, inviteUrl, placeholder = "Search anyone at EPFL by name" }: { autoFocus?: boolean; inviteUrl?: string; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PersonView[] | null>(null);
  const [directory, setDirectory] = useState<DirectoryPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) return;
    const my = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = (await res.json()) as { people: PersonView[]; directory?: DirectoryPerson[] };
        if (my === seq.current) {
          setResults(data.people);
          setDirectory(data.directory ?? []);
        }
      } catch {
        if (my === seq.current) {
          setResults([]);
          setDirectory([]);
        }
      } finally {
        if (my === seq.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [term]);

  function onChange(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      seq.current++;
      setResults(null);
      setDirectory([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  return (
    <div>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          inputMode="search"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={input("lg", "pl-10")}
        />
      </div>
      {term.length >= 2 && (
        <div className="mt-3 space-y-3 animate-in">
          {results === null ? (
            <p className="rounded-2xl bg-surface border border-line px-4 py-6 text-center text-sm text-muted">Searching…</p>
          ) : (
            <>
              {results.length > 0 && (
                <ul className="rounded-2xl bg-surface border border-line divide-y divide-line overflow-hidden">
                  {results.map((p) => (
                    <PersonRow key={p.id} person={p} />
                  ))}
                </ul>
              )}
              {directory.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 px-1">Not on dispo yet</h3>
                  <ul className="rounded-2xl bg-surface border border-line divide-y divide-line overflow-hidden">
                    {directory.map((d) => (
                      <li key={d.sciper} className="flex items-center gap-3 px-4 py-3">
                        <div className="opacity-60">
                          <Avatar name={d.name} size={40} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{d.name}</div>
                          <div className="text-sm text-muted truncate">
                            {[d.unit, d.role].filter(Boolean).join(" · ") || "EPFL"}
                            {d.profileUrl && (
                              <>
                                {" · "}
                                <ExternalLink href={d.profileUrl}>profile</ExternalLink>
                              </>
                            )}
                          </div>
                        </div>
                        <InviteButton firstName={d.name.split(" ")[0]} email={d.email} inviteUrl={inviteUrl} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {results.length === 0 && directory.length === 0 && (
                <p className="rounded-2xl bg-surface border border-line px-4 py-6 text-center text-sm text-muted">
                  {loading ? "Searching…" : term.length < 3 ? "Nobody on dispo matches. Type a bit more to search the EPFL directory." : "Nobody found on dispo or in the EPFL directory."}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
