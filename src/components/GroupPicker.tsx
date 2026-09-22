"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { PersonView } from "@/lib/present";
import { deleteGroupAction, groupShareUrl, leaveGroupAction, renameGroupAction } from "@/app/actions";
import { ShareLinkButton } from "./ShareLinkButton";
import { StarButton } from "./StarButton";
import { Avatar } from "./Avatar";
import { ConfirmAction } from "./ConfirmAction";
import { button, chip, iconButton, input } from "@/lib/ui";

type Person = { id: string; name: string; image: string | null };
export type MatchedGroup = { id: string; name: string; isOwner: boolean; shareUrl: string | null; ownerFirstName?: string };
export type PanelGroup = { id: string; name: string; memberIds: string[]; starred: boolean };

/**
 * Who is on the calendar. The view is described only by the people in it (the URL). When they
 * match a saved group exactly, that group's rename/delete controls appear in the panel.
 */
export function GroupPicker({
  friends,
  selected,
  week,
  matchedGroup,
  groups = [],
  starredUserIds = [],
  trailing,
}: {
  friends: Person[];
  selected: Person[];
  week: string | null;
  matchedGroup: MatchedGroup | null;
  groups?: PanelGroup[];
  starredUserIds?: string[];
  trailing?: React.ReactNode;
}) {
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
            <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from this view`} className={iconButton("quiet", "sm", "size-7")}>
              ×
            </button>
          </span>
        ))}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={button("add")}
        >
          {open ? "Done" : selected.length ? "+ Add" : "+ Add people"}
        </button>
        {selected.length > 0 && (
          <Link href={hrefFor([])} className={button("quiet")}>
            Clear
          </Link>
        )}
        {trailing}
      </div>

      {open && (
        <div className="mt-2 border border-line bg-surface p-3 space-y-3 animate-in">
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
          {term.length >= 2 ? (
            <PeopleList people={searchHits} onPick={add} empty="No match." />
          ) : available.length > 0 ? (
            <>
              <div className="text-xs font-bold text-muted uppercase tracking-wide">Your people · ★ pins them to the top</div>
              <PeopleList people={available} onPick={add} starredIds={starredUserIds} />
            </>
          ) : (
            <p className="text-sm text-muted">{friends.length === 0 ? "Connect with friends first, or search anyone above." : "Everyone you’re connected with is already here."}</p>
          )}

          {term.length < 2 && groups.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted uppercase tracking-wide">Groups</div>
              <ul className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <li key={g.id} className="flex">
                    <Link href={hrefFor(g.memberIds)} onClick={() => setOpen(false)} className={button("secondary", "sm", "rounded-r-none border-r-0")}>
                      {g.name}
                    </Link>
                    <StarButton kind="group" id={g.id} starred={g.starred} name={g.name} className="rounded-l-none" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {matchedGroup && (
            <div className="border-t border-line pt-3 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-muted uppercase tracking-wide">Group “{matchedGroup.name}”</span>
                <span className="text-xs text-muted">
                  {matchedGroup.shareUrl ? "Shared · members see it" : "Private · only you see it"}
                </span>
              </div>
              {matchedGroup.isOwner ? (
                <div className="flex flex-wrap items-center gap-2">
                  <form action={renameGroupAction} className="flex flex-1 min-w-[12rem] gap-2">
                    <input type="hidden" name="groupId" value={matchedGroup.id} />
                    <input name="name" required maxLength={60} defaultValue={matchedGroup.name} aria-label="Group name" className={input("sm", "min-w-0 flex-1 w-auto")} />
                    <button type="submit" className={button("secondary")}>
                      Rename
                    </button>
                  </form>
                  <ShareLinkButton
                    url={matchedGroup.shareUrl ?? undefined}
                    getUrl={() => groupShareUrl(matchedGroup.id)}
                    title={`Join “${matchedGroup.name}” on dispo`}
                    text="See when everyone’s free:"
                    label={matchedGroup.shareUrl ? "Share link" : "Get share link"}
                    variant="secondary"
                  />
                  <ConfirmAction
                    fields={{ groupId: matchedGroup.id, members: selectedIds.join(",") }}
                    action={deleteGroupAction}
                    label="Delete group"
                    question="Delete this group?"
                    confirmLabel="Delete"
                    className={button("danger")}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted flex-1">Shared by {matchedGroup.ownerFirstName ?? "a friend"}.</span>
                  {matchedGroup.shareUrl && (
                    <ShareLinkButton url={matchedGroup.shareUrl} title={`Join “${matchedGroup.name}” on dispo`} text="See when everyone’s free:" variant="secondary" />
                  )}
                  <form action={leaveGroupAction}>
                    <input type="hidden" name="groupId" value={matchedGroup.id} />
                    <button className={button("danger")}>Leave group</button>
                  </form>
                </div>
              )}
              {matchedGroup.isOwner && !matchedGroup.shareUrl && (
                <p className="text-xs text-muted">A share link lets anyone who has it join, and makes the group visible to its members.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PeopleList({ people, onPick, empty, starredIds }: { people: Person[]; onPick: (id: string) => void; empty?: string; starredIds?: string[] }) {
  if (people.length === 0) return empty ? <p className="text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="flex flex-wrap gap-2">
      {people.map((p) => (
        <li key={p.id} className="flex">
          <button onClick={() => onPick(p.id)} className={button("secondary", "sm", `pl-1 font-normal ${starredIds ? "rounded-r-none border-r-0" : ""}`)}>
            <Avatar name={p.name} image={p.image} size={20} />
            {p.name}
            <span className="text-accent-ink font-bold">+</span>
          </button>
          {starredIds && <StarButton kind="user" id={p.id} starred={starredIds.includes(p.id)} name={p.name} className="rounded-l-none" />}
        </li>
      ))}
    </ul>
  );
}
