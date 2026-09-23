"use client";

import { useCallback, useState } from "react";
import type { EventView } from "@/lib/present";
import { toneFor } from "@/lib/present";
import { addDays, dateInputValue, fmtDayNum, fmtDayShort, fmtTime, localParts, zonedInstant } from "@/lib/time";
import { useLocale, useT } from "@/i18n/client";
import { TimeBlockSheet, type SheetTarget } from "./TimeBlockSheet";

type Props = {
  weekStart: number;
  events: EventView[];
  todayIndex: number | null;
  now: number;
  masked: boolean;
  /** Your own week: tap a block to skip or change it, an empty hour to block time. */
  editable?: boolean;
};

/** Start of `hour` on the Zurich day `dayMs`, and the hour after it: the default for a new block. */
function hourSlot(dayMs: number, hour: number): { start: number; end: number } {
  const start = zonedInstant(dateInputValue(dayMs), `${String(hour).padStart(2, "0")}:00`) ?? dayMs + hour * 3_600_000;
  return { start, end: start + 3_600_000 };
}

/** Assign side-by-side lanes to events that overlap within a day. */
function withLanes(list: EventView[]): { e: EventView; lane: number; lanes: number }[] {
  const sorted = [...list].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: { e: EventView; lane: number; lanes: number }[] = [];
  let cluster: { e: EventView; lane: number; lanes: number }[] = [];
  let clusterEnd = -Infinity;
  const laneEnds: number[] = [];
  const flush = () => {
    for (const c of cluster) c.lanes = laneEnds.length;
    out.push(...cluster);
    cluster = [];
    laneEnds.length = 0;
  };
  for (const e of sorted) {
    if (e.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= e.start);
    if (lane === -1) lane = laneEnds.push(0) - 1;
    laneEnds[lane] = e.end;
    cluster.push({ e, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, e.end);
  }
  flush();
  return out;
}

/** Time you cleared (a free block or a skipped session): drawn as an outline, not as something on. */
function isCleared(e: EventView): e is EventView & { block: { kind: "free" | "skip" } } {
  return e.block != null && e.block.kind !== "busy";
}

function colorStyle(e: EventView): React.CSSProperties {
  // Your free time: an outline where something was cleared, so it can be seen and undone.
  if (isCleared(e))
    return { background: "color-mix(in oklab, var(--free) 6%, transparent)", borderColor: "var(--free)", borderStyle: "dashed", color: "var(--free)" };
  // Personal plans: hatched, so they read as busy without looking like a class.
  if (e.personal)
    return {
      background: "repeating-linear-gradient(135deg, color-mix(in oklab, var(--foreground) 9%, var(--surface)) 0 5px, var(--surface) 5px 10px)",
      borderColor: "color-mix(in oklab, var(--foreground) 35%, var(--surface))",
      borderLeft: "3px solid var(--foreground)",
      color: "var(--foreground)",
    };
  if (e.masked) return { background: "color-mix(in oklab, var(--muted) 20%, var(--surface))", borderColor: "color-mix(in oklab, var(--muted) 45%, var(--surface))", color: "var(--muted)" };
  const t = toneFor(e.title);
  return { background: t.bg, borderColor: t.border, borderLeft: `3px solid ${t.base}`, color: t.text };
}

/** A block's name: the course, your note, "Busy" for a busy block without one, or "Free" / "Skipped". */
function useLabel(): (e: EventView) => string {
  const t = useT();
  return (e) => (isCleared(e) ? t.calendar.blocks[e.block.kind] : e.title || t.status.busy);
}

function titleFor(e: EventView, label: string): string {
  return [label, `${fmtTime(e.start)}–${fmtTime(e.end)}`, e.masked ? null : e.rooms].filter(Boolean).join(" · ");
}

/** Block text; `.ev` sizing in globals.css picks one line, title + room, or a two-line title. */
function BlockBody({ e, live }: { e: EventView; live?: boolean }) {
  const t = useT();
  const label = useLabel()(e);
  const sub = e.masked
    ? ""
    : e.block
      ? [e.block.kind === "skip" && e.title, e.block.weekly && t.calendar.blocks.weekly].filter(Boolean).join(" · ")
      : [t.calendar.kinds[e.kind], e.rooms].filter(Boolean).join(" · ");
  return (
    <div className="ev-body">
      <div className="ev-head">
        <span className="ev-title">{label}</span>
        {live && <span className="text-[10px] font-bold uppercase tracking-wide text-busy shrink-0">{t.calendar.live}</span>}
      </div>
      {sub && <div className="ev-sub">{sub}</div>}
    </div>
  );
}

/**
 * A week that fills its container: day tabs + a stretching day timeline on phones, a week grid
 * on wider screens. Hour rows share the available height, so the whole day is visible without
 * scrolling. Blocks carry no times; the hour axis already shows them.
 */
export function WeekView({ weekStart, events, todayIndex, now, masked, editable = false }: Props) {
  const t = useT();
  const locale = useLocale();
  const label = useLabel();
  const [target, setTarget] = useState<SheetTarget | null>(null);
  const close = useCallback(() => setTarget(null), []);
  const pick = editable ? (e: EventView) => setTarget({ type: "event", e }) : undefined;
  const pickHour = editable ? (dayMs: number, hour: number) => setTarget({ type: "new", ...hourSlot(dayMs, hour) }) : undefined;
  // While the sheet is open, the slot or block it's about stays marked, so a tap visibly lands where you meant.
  const pickedSlot = target?.type === "new" ? localParts(target.start) : null;
  const isPickedHour = (day: number, hour: number) => pickedSlot?.day === day && pickedSlot.minutes === hour * 60;
  const isPickedEvent = (e: EventView) => target?.type === "event" && target.e.id === e.id && target.e.start === e.start;
  const dayCount = events.some((e) => localParts(e.start).day >= 5) ? 7 : 5;
  const [selected, setSelected] = useState(todayIndex != null && todayIndex < dayCount ? todayIndex : 0);
  const byDay: EventView[][] = Array.from({ length: dayCount }, () => []);
  for (const e of events) {
    const d = localParts(e.start).day;
    if (d < dayCount) byDay[d].push(e);
  }

  // Grid bounds (whole hours), default 08–19, extended to fit events.
  let minH = 8;
  let maxH = 19;
  for (const e of events) {
    minH = Math.min(minH, Math.floor(localParts(e.start).minutes / 60));
    const endParts = localParts(e.end);
    maxH = Math.max(maxH, Math.ceil((endParts.minutes === 0 ? 24 * 60 : endParts.minutes) / 60));
  }
  const hours = maxH - minH;
  const slots = hours * 4; // 15-minute rows
  const rowOfMinutes = (m: number) => Math.round((m - minH * 60) / 15) + 1;
  const nowParts = localParts(now);
  const nowFrac = (nowParts.minutes - minH * 60) / (hours * 60); // 0..1 within the visible day
  const rowsStyle = { gridTemplateRows: `repeat(${slots}, minmax(0, 1fr))` };

  return (
    <section className="flex flex-col flex-1 min-h-0">
      {/* Phone: day tabs + that day as a timeline */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 gap-2">
        <div className="grid gap-1 shrink-0" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
          {byDay.map((list, i) => {
            const dayMs = addDays(weekStart, i);
            const isSel = i === selected;
            const isToday = i === todayIndex;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`rounded-2xl py-1.5 flex flex-col items-center gap-0.5 border ${isSel ? "bg-foreground text-background border-foreground" : "bg-surface border-line"}`}
              >
                <span className={`text-[11px] uppercase tracking-wide ${isSel ? "opacity-80" : "text-muted"}`}>{fmtDayShort(dayMs, locale)}</span>
                <span className={`text-base font-bold leading-none ${isToday && !isSel ? "text-accent-ink" : ""}`}>{fmtDayNum(dayMs)}</span>
                <span className="flex gap-0.5 h-1.5">
                  {list.filter((e) => !isCleared(e)).slice(0, 4).map((e, k) => (
                    <span key={k} className="size-1.5 rounded-full" style={{ background: e.masked ? "var(--muted)" : e.personal ? "var(--foreground)" : toneFor(e.title).base }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <DayTimeline
          key={`${weekStart}-${selected}`}
          events={byDay[selected]}
          now={now}
          minH={minH}
          maxH={maxH}
          isToday={selected === todayIndex}
          isPast={todayIndex == null ? weekStart < now : selected < todayIndex}
          onPick={pick}
          onPickHour={pickHour && ((hour) => pickHour(addDays(weekStart, selected), hour))}
          isPickedHour={(hour) => isPickedHour(selected, hour)}
          isPickedEvent={isPickedEvent}
        />
      </div>

      {/* Tablet / laptop: week grid */}
      <div className="hidden md:flex flex-col flex-1 min-h-80 rounded-2xl bg-surface border border-line overflow-hidden">
        <div className="grid shrink-0" style={{ gridTemplateColumns: `3rem repeat(${dayCount}, minmax(0, 1fr))` }}>
          <div />
          {Array.from({ length: dayCount }, (_, i) => {
            const dayMs = addDays(weekStart, i);
            return (
              <div key={i} className={`text-center py-2 text-sm border-b border-l border-line ${i === todayIndex ? "text-accent-ink font-bold" : "text-muted"}`}>
                {fmtDayShort(dayMs, locale)} {fmtDayNum(dayMs)}
              </div>
            );
          })}
        </div>
        <div className="grid relative flex-1 min-h-0" style={{ gridTemplateColumns: `3rem repeat(${dayCount}, minmax(0, 1fr))`, ...rowsStyle }}>
          {Array.from({ length: hours }, (_, h) => (
            <div key={`l${h}`} className={`text-[11px] text-muted text-right pr-2 tabular-nums ${h === 0 ? "pt-0.5" : "-translate-y-2"}`} style={{ gridColumn: 1, gridRow: `${h * 4 + 1} / span 4` }}>
              {String(minH + h).padStart(2, "0")}:00
            </div>
          ))}
          {Array.from({ length: dayCount * hours }, (_, k) => {
            const col = (k % dayCount) + 2;
            const row = Math.floor(k / dayCount) * 4 + 1;
            const pastCell = todayIndex == null ? weekStart < now : col - 2 < todayIndex;
            const cls = `border-l border-line/70 ${row > 1 ? "border-t" : ""} ${pastCell ? "bg-foreground/[0.03]" : ""}`;
            const style = { gridColumn: col, gridRow: `${row} / span 4` };
            if (!pickHour) return <div key={k} className={cls} style={style} />;
            const hour = minH + Math.floor(k / dayCount);
            return (
              <button
                key={k}
                type="button"
                // Mouse/touch shortcut only: the header's "Block time" button is the accessible way in.
                tabIndex={-1}
                aria-hidden
                onClick={() => pickHour(addDays(weekStart, col - 2), hour)}
                className={`${cls} cursor-pointer hover:bg-accent/5 active:bg-accent/15 ${isPickedHour(col - 2, hour) ? "slot-picked" : ""}`}
                style={style}
              />
            );
          })}
          {byDay.flatMap((list, day) =>
            withLanes(list).map(({ e, lane, lanes }) => {
              const s = localParts(e.start);
              const en = localParts(e.end);
              const Tag = pick && !e.masked ? "button" : "div";
              return (
                <Tag
                  key={`${e.id}:${e.start}`}
                  {...(Tag === "button" ? { type: "button" as const, onClick: () => pick!(e) } : {})}
                  className={`ev m-px rounded-md border px-1.5 py-0.5 text-[11px] leading-tight overflow-hidden text-left ${Tag === "button" ? "cursor-pointer hover:brightness-95 active:brightness-90" : ""} ${isPickedEvent(e) ? "ev-picked" : ""}`}
                  style={{
                    gridColumn: day + 2,
                    gridRow: `${Math.max(1, rowOfMinutes(s.minutes))} / ${Math.min(slots + 1, rowOfMinutes(en.minutes || 24 * 60))}`,
                    width: lanes > 1 ? `calc(${100 / lanes}% - 2px)` : undefined,
                    marginLeft: lanes > 1 ? `calc(${(lane * 100) / lanes}% + 1px)` : undefined,
                    ...colorStyle(e),
                  }}
                  title={titleFor(e, label(e))}
                >
                  <BlockBody e={e} />
                </Tag>
              );
            }),
          )}
          {todayIndex != null && todayIndex < dayCount && nowFrac >= 0 && nowFrac <= 1 && (
            <div className="pointer-events-none relative" style={{ gridColumn: todayIndex + 2, gridRow: `1 / ${slots + 1}` }}>
              <div className="absolute inset-x-0 h-0.5 bg-accent" style={{ top: `${nowFrac * 100}%` }} />
            </div>
          )}
        </div>
      </div>
      {masked && <p className="shrink-0 mt-2 text-xs text-muted text-center">{t.calendar.maskedNote}</p>}
      {target && <TimeBlockSheet target={target} onClose={close} />}
    </section>
  );
}

/** One day as a timeline that fills the remaining height: blocks sit at their real times. */
function DayTimeline({
  events,
  now,
  minH,
  maxH,
  isToday,
  isPast,
  onPick,
  onPickHour,
  isPickedHour,
  isPickedEvent,
}: {
  events: EventView[];
  now: number;
  minH: number;
  maxH: number;
  isToday: boolean;
  isPast: boolean;
  onPick?: (e: EventView) => void;
  onPickHour?: (hour: number) => void;
  isPickedHour: (hour: number) => boolean;
  isPickedEvent: (e: EventView) => boolean;
}) {
  const hours = maxH - minH;
  const slots = hours * 4;
  const rowOfMinutes = (m: number) => Math.round((m - minH * 60) / 15) + 1;
  const nowFrac = (localParts(now).minutes - minH * 60) / (hours * 60);
  const pastFrac = isPast ? 1 : isToday ? Math.max(0, Math.min(1, nowFrac)) : 0;
  const t = useT();
  const label = useLabel();

  return (
    <div className="relative flex-1 min-h-72 rounded-2xl bg-surface border border-line overflow-hidden animate-fade">
      <div className="grid h-full" style={{ gridTemplateColumns: "2.75rem minmax(0, 1fr)", gridTemplateRows: `repeat(${slots}, minmax(0, 1fr))` }}>
        {Array.from({ length: hours }, (_, h) => (
          <div key={`l${h}`} className={`text-[10px] text-muted text-right pr-1.5 tabular-nums ${h === 0 ? "pt-0.5" : "-translate-y-1.5"}`} style={{ gridColumn: 1, gridRow: `${h * 4 + 1} / span 4` }}>
            {String(minH + h).padStart(2, "0")}:00
          </div>
        ))}
        {Array.from({ length: hours }, (_, h) => {
          const cls = `border-l border-line/70 ${h === 0 ? "" : "border-t"}`;
          const style = { gridColumn: 2, gridRow: `${h * 4 + 1} / span 4` };
          if (!onPickHour) return <div key={`g${h}`} className={cls} style={style} />;
          return (
            <button
              key={`g${h}`}
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={() => onPickHour(minH + h)}
              className={`${cls} active:bg-accent/15 ${isPickedHour(minH + h) ? "slot-picked" : ""}`}
              style={style}
            />
          );
        })}
        {withLanes(events).map(({ e, lane, lanes }) => {
          const live = e.start <= now && now < e.end;
          const s = localParts(e.start);
          const en = localParts(e.end);
          const Tag = onPick && !e.masked ? "button" : "div";
          return (
            <Tag
              key={`${e.id}:${e.start}`}
              {...(Tag === "button" ? { type: "button" as const, onClick: () => onPick!(e) } : {})}
              className={`ev m-px rounded-md border px-2 py-0.5 text-xs leading-tight overflow-hidden text-left ${Tag === "button" ? "active:brightness-90" : ""} ${isPickedEvent(e) ? "ev-picked" : ""}`}
              style={{
                gridColumn: 2,
                gridRow: `${Math.max(1, rowOfMinutes(s.minutes))} / ${Math.min(slots + 1, rowOfMinutes(en.minutes || 24 * 60))}`,
                width: lanes > 1 ? `calc(${100 / lanes}% - 2px)` : undefined,
                marginLeft: lanes > 1 ? `calc(${(lane * 100) / lanes}% + 1px)` : undefined,
                ...colorStyle(e),
              }}
              title={titleFor(e, label(e))}
            >
              <BlockBody e={e} live={live && !isCleared(e)} />
            </Tag>
          );
        })}
      </div>
      {pastFrac > 0 && <div className="pointer-events-none absolute top-0 right-0 left-[2.75rem] bg-foreground/[0.04]" style={{ height: `${pastFrac * 100}%` }} />}
      {isToday && nowFrac >= 0 && nowFrac <= 1 && <div className="pointer-events-none absolute right-0 left-[2.75rem] h-0.5 bg-accent" style={{ top: `${nowFrac * 100}%` }} />}
      {events.length === 0 && <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">{t.calendar.nothingScheduled}</div>}
    </div>
  );
}
