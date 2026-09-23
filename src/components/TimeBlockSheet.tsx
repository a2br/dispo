"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { addTimeBlockAction, removeTimeBlockAction, skipAction } from "@/app/actions";
import type { EventView } from "@/lib/present";
import { button, input } from "@/lib/ui";
import { dateInputValue, fmtDayLong, fmtDayMonth, fmtTime } from "@/lib/time";
import { useLocale, useT } from "@/i18n/client";
import { CloseIcon } from "./Icons";

/** What the sheet is about: a new block (prefilled times) or a block tapped in the calendar. */
export type SheetTarget = { type: "new"; start: number; end: number } | { type: "event"; e: EventView };

/**
 * Over the calendar: a bottom sheet on phones, a centred dialog on wider screens. Rendered on <body>:
 * `main` fades in with a lasting animation, which makes it a stacking context that would keep the
 * dialog under the sidebar and the bottom bar whatever its z-index.
 */
export function TimeBlockSheet({ target, onClose }: { target: SheetTarget; onClose: () => void }) {
  const t = useT().calendar.blocks;
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-40 grid items-end justify-items-center sm:items-center bg-foreground/40 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4 animate-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-sheet-title"
      onClick={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-surface border border-line p-5 space-y-4 animate-in">
        <button type="button" onClick={onClose} aria-label={t.cancel} className="absolute top-3 right-3 size-8 grid place-items-center text-muted hover:text-foreground">
          <CloseIcon />
        </button>
        {target.type === "new" ? <NewBlockForm start={target.start} end={target.end} onDone={onClose} /> : <BlockActions e={target.e} onDone={onClose} />}
      </div>
    </div>,
    document.body,
  );
}

function When({ start, end }: { start: number; end: number }) {
  const locale = useLocale();
  return (
    <p className="text-sm text-muted">
      <span className="capitalize">{fmtDayLong(start, locale)}</span> {fmtDayMonth(start, locale)} · {fmtTime(start)}–{fmtTime(end)}
    </p>
  );
}

function NewBlockForm({ start, end, onDone }: { start: number; end: number; onDone: () => void }) {
  const t = useT().calendar.blocks;
  const [kind, setKind] = useState<"busy" | "free">("busy");
  const [weekly, setWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    startTransition(async () => {
      const res = await addTimeBlockAction(data);
      if (res.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 id="block-sheet-title" className="text-xl font-bold tracking-tight pr-8">{t.title}</h2>
      <div className="grid grid-cols-2 gap-1 p-1 bg-subtle border border-line rounded-sm" role="radiogroup">
        {(["busy", "free"] as const).map((k) => (
          <label key={k} className={`h-8 grid place-items-center rounded-sm text-sm font-bold cursor-pointer ${kind === k ? "bg-surface border border-line-strong" : "text-muted"}`}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
            {t[k]}
          </label>
        ))}
      </div>
      <p className="text-sm text-muted -mt-2">{kind === "busy" ? t.busyHint : t.freeHint}</p>

      <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
        <label className="space-y-1 min-w-0">
          <span className="block text-xs font-bold text-muted">{t.day}</span>
          <input type="date" name="date" required defaultValue={dateInputValue(start)} className={input("md")} />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-bold text-muted">{t.from}</span>
          <input type="time" name="from" required step={900} defaultValue={fmtTime(start)} className={input("md", "w-[6.5rem]")} />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-bold text-muted">{t.to}</span>
          <input type="time" name="to" required step={900} defaultValue={fmtTime(end)} className={input("md", "w-[6.5rem]")} />
        </label>
      </div>

      {kind === "busy" && (
        <label className="block space-y-1">
          <span className="block text-xs font-bold text-muted">
            {t.note} <span className="font-normal">({t.optional})</span>
          </span>
          <input type="text" name="note" maxLength={80} autoComplete="off" placeholder={t.notePlaceholder} className={input("md")} />
          <span className="block text-xs text-muted">{t.noteIsPrivate}</span>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-h-10">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input type="checkbox" name="weekly" checked={weekly} onChange={(ev) => setWeekly(ev.target.checked)} className="size-4 accent-[var(--accent)]" />
          {t.weekly}
        </label>
        {weekly && (
          <label className="flex flex-1 items-center gap-2 text-sm min-w-[12rem]">
            <span className="text-muted whitespace-nowrap">{t.until}</span>
            <input type="date" name="until" min={dateInputValue(start)} aria-describedby="until-optional" className={input("sm", "flex-1 w-auto min-w-0")} />
            <span id="until-optional" className="sr-only">{t.optional}</span>
          </label>
        )}
      </div>

      {error && <p className="text-sm text-busy">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onDone} className={button("secondary", "md", "flex-1")}>{t.cancel}</button>
        <button type="submit" disabled={pending} className={button("primary", "md", "flex-1")}>{t.save}</button>
      </div>
    </form>
  );
}

/** Actions for a block tapped in your own week: skip a class, free or remove a busy block, undo a free one. */
function BlockActions({ e, onDone }: { e: EventView; onDone: () => void }) {
  const tt = useT();
  const t = tt.calendar.blocks;
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<void>) => startTransition(async () => {
    await fn();
    onDone();
  });
  const block = e.block;
  const title = block && block.kind !== "busy" ? t[block.kind] : e.title || tt.status.busy;
  const sub = block
    ? [block.kind === "skip" && e.title, block.weekly && t.weekly].filter(Boolean).join(" · ")
    : [tt.calendar.kinds[e.kind], e.rooms].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <div className="space-y-1 pr-8">
        <h2 id="block-sheet-title" className="text-xl font-bold tracking-tight">{title}</h2>
        <When start={e.start} end={e.end} />
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {!block && <p className="text-sm text-muted">{t.skipHint}</p>}
      <div className="flex flex-col gap-2">
        {!block && (
          <>
            <button type="button" disabled={pending} onClick={() => run(() => skipAction(e.start, e.end, false, { course: e.title }))} className={button("primary", "md", "w-full")}>
              {t.skipOnce}
            </button>
            <button type="button" disabled={pending} onClick={() => run(() => skipAction(e.start, e.end, true, { course: e.title }))} className={button("secondary", "md", "w-full")}>
              {t.skipWeekly}
            </button>
          </>
        )}
        {block?.kind === "busy" && block.weekly && (
          <button type="button" disabled={pending} onClick={() => run(() => skipAction(e.start, e.end, false, { blockId: block.id }))} className={button("secondary", "md", "w-full")}>
            {t.freeOnce}
          </button>
        )}
        {block && (
          <button type="button" disabled={pending} onClick={() => run(() => removeTimeBlockAction(block.id))} className={button(block.kind === "busy" ? "danger" : "secondary", "md", "w-full")}>
            {block.kind === "busy" ? (block.weekly ? t.removeWeekly : t.remove) : block.weekly ? t.undoWeekly : t.undo}
          </button>
        )}
      </div>
    </div>
  );
}
