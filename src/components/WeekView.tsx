"use client";

import Link from "next/link";
import { useState } from "react";
import type { EventView } from "@/lib/present";
import { hueFor } from "@/lib/present";
import { fmtDayNum, fmtDayShort, fmtTime, fmtWeekLabel, isoDate, localParts, addDays } from "@/lib/time";

const KIND_LABEL: Record<EventView["kind"], string> = {
  lecture: "Lecture",
  exercise: "Exercises",
  lab: "Lab",
  project: "Project",
  other: "",
};

type Props = {
  weekStart: number;
  events: EventView[];
  todayIndex: number | null;
  now: number;
  basePath: string; // e.g. /u/<id>
  masked: boolean;
  hideNav?: boolean; // the page renders its own week navigation
};

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

function colorStyle(e: EventView): React.CSSProperties {
  if (e.masked) return { background: "color-mix(in oklab, var(--muted) 22%, transparent)", borderColor: "color-mix(in oklab, var(--muted) 45%, transparent)" };
  const h = hueFor(e.title);
  return { background: `hsl(${h} 70% 90%)`, borderColor: `hsl(${h} 60% 70%)`, color: `hsl(${h} 45% 22%)` };
}

export function WeekView({ weekStart, events, todayIndex, now, basePath, masked, hideNav = false }: Props) {
  const dayCount = events.some((e) => localParts(e.start).day >= 5) ? 7 : 5;
  const [selected, setSelected] = useState(todayIndex != null && todayIndex < dayCount ? todayIndex : 0);
  const byDay: EventView[][] = Array.from({ length: dayCount }, () => []);
  for (const e of events) {
    const d = localParts(e.start).day;
    if (d < dayCount) byDay[d].push(e);
  }
  const prev = isoDate(addDays(weekStart, -7));
  const next = isoDate(addDays(weekStart, 7));
  const thisWeek = todayIndex != null;

  // Grid bounds (whole hours), default 08–19, extended to fit events.
  let minH = 8;
  let maxH = 19;
  for (const e of events) {
    minH = Math.min(minH, Math.floor(localParts(e.start).minutes / 60));
    const endParts = localParts(e.end);
    maxH = Math.max(maxH, Math.ceil((endParts.minutes === 0 ? 24 * 60 : endParts.minutes) / 60));
  }
  const slots = (maxH - minH) * 4; // 15-min rows
  const nowParts = localParts(now);

  return (
    <section>
      <header className={`flex items-center justify-between gap-2 mb-3 ${hideNav ? "hidden" : ""}`}>
        <Link href={`${basePath}?w=${prev}`} aria-label="Previous week" className="size-10 grid place-items-center rounded-full bg-surface border border-line active:opacity-70">
          ‹
        </Link>
        <div className="text-center">
          <div className="font-semibold">{fmtWeekLabel(weekStart)}</div>
          {!thisWeek && (
            <Link href={basePath} className="text-xs text-accent">
              Back to this week
            </Link>
          )}
        </div>
        <Link href={`${basePath}?w=${next}`} aria-label="Next week" className="size-10 grid place-items-center rounded-full bg-surface border border-line active:opacity-70">
          ›
        </Link>
      </header>

      {/* Phone: day tabs + that day as a timeline */}
      <div className="md:hidden">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
          {byDay.map((list, i) => {
            const dayMs = addDays(weekStart, i);
            const isSel = i === selected;
            const isToday = i === todayIndex;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`rounded-2xl py-2 flex flex-col items-center gap-1 border ${isSel ? "bg-foreground text-background border-foreground" : "bg-surface border-line"}`}
              >
                <span className={`text-[11px] uppercase tracking-wide ${isSel ? "opacity-80" : "text-muted"}`}>{fmtDayShort(dayMs)}</span>
                <span className={`text-base font-semibold ${isToday && !isSel ? "text-accent" : ""}`}>{fmtDayNum(dayMs)}</span>
                <span className="flex gap-0.5 h-1.5">
                  {list.slice(0, 4).map((e) => (
                    <span key={e.id} className="size-1.5 rounded-full" style={{ background: e.masked ? "var(--muted)" : `hsl(${hueFor(e.title)} 60% 55%)` }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <DayTimeline
          events={byDay[selected]}
          dayStart={addDays(weekStart, selected)}
          now={now}
          minH={minH}
          maxH={maxH}
          isToday={selected === todayIndex}
          isPast={todayIndex == null ? weekStart < now : selected < todayIndex}
        />
      </div>

      {/* Desktop: week grid */}
      <div className="hidden md:block rounded-2xl bg-surface border border-line overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `3rem repeat(${dayCount}, minmax(0, 1fr))` }}>
          <div />
          {Array.from({ length: dayCount }, (_, i) => {
            const dayMs = addDays(weekStart, i);
            return (
              <div key={i} className={`text-center py-2 text-sm border-b border-l border-line ${i === todayIndex ? "text-accent font-semibold" : "text-muted"}`}>
                {fmtDayShort(dayMs)} {fmtDayNum(dayMs)}
              </div>
            );
          })}
        </div>
        <div className="grid relative" style={{ gridTemplateColumns: `3rem repeat(${dayCount}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${slots}, 0.9rem)` }}>
          {Array.from({ length: maxH - minH }, (_, i) => (
            <div key={i} className="text-[11px] text-muted text-right pr-2 -translate-y-2 border-t border-line/60" style={{ gridColumn: 1, gridRow: `${i * 4 + 1} / span 4` }}>
              {String(minH + i).padStart(2, "0")}:00
            </div>
          ))}
          {Array.from({ length: dayCount * (maxH - minH) }, (_, k) => {
            const col = (k % dayCount) + 2;
            const row = Math.floor(k / dayCount) * 4 + 1;
            return <div key={k} className="border-t border-l border-line/60" style={{ gridColumn: col, gridRow: `${row} / span 4` }} />;
          })}
          {byDay.flatMap((list, day) => withLanes(list).map(({ e, lane, lanes }) => {
            const s = localParts(e.start);
            const en = localParts(e.end);
            const rowStart = Math.max(1, Math.round((s.minutes - minH * 60) / 15) + 1);
            const rowEnd = Math.min(slots + 1, Math.round(((en.minutes || 24 * 60) - minH * 60) / 15) + 1);
            return (
              <div
                key={e.id}
                className="m-px rounded-md border px-1.5 py-1 text-[11px] leading-tight overflow-hidden"
                style={{
                  gridColumn: day + 2,
                  gridRow: `${rowStart} / ${rowEnd}`,
                  width: lanes > 1 ? `calc(${100 / lanes}% - 2px)` : undefined,
                  marginLeft: lanes > 1 ? `calc(${(lane * 100) / lanes}% + 1px)` : undefined,
                  ...colorStyle(e),
                }}
                title={e.masked ? "Busy" : `${e.title} · ${fmtTime(e.start)}–${fmtTime(e.end)}${e.rooms ? " · " + e.rooms : ""}`}
              >
                <div className="font-semibold truncate">{e.title}</div>
                {!e.masked && <div className="truncate opacity-80">{[KIND_LABEL[e.kind], e.rooms].filter(Boolean).join(" · ")}</div>}
              </div>
            );
          }))}
          {todayIndex != null && todayIndex < dayCount && nowParts.minutes >= minH * 60 && nowParts.minutes <= maxH * 60 && (
            <div
              className="pointer-events-none h-0.5 bg-accent"
              style={{
                gridColumn: todayIndex + 2,
                gridRow: Math.min(slots, Math.floor((nowParts.minutes - minH * 60) / 15) + 1),
                marginTop: `${((nowParts.minutes % 15) / 15) * 0.9}rem`,
              }}
            />
          )}
        </div>
      </div>
      {masked && <p className="mt-3 text-xs text-muted text-center">You’re seeing free/busy only. Connect to see courses and rooms.</p>}
    </section>
  );
}


const DAY_ROW_REM = 1.1; // one 15-minute row on the phone timeline

/** One day as a timeline: blocks sit at their real times, like the Find a time grid. */
function DayTimeline({
  events,
  dayStart,
  now,
  minH,
  maxH,
  isToday,
  isPast,
}: {
  events: EventView[];
  dayStart: number;
  now: number;
  minH: number;
  maxH: number;
  isToday: boolean;
  isPast: boolean;
}) {
  if (events.length === 0) {
    return <div className="mt-3 rounded-2xl bg-surface border border-line px-4 py-8 text-center text-muted">Nothing scheduled. Free all day.</div>;
  }
  const rows = (maxH - minH) * 4;
  const winStart = dayStart + minH * 3_600_000; // weekdays never contain a DST switch
  const rowOf = (ms: number) => Math.round((ms - winStart) / 900_000) + 1;
  const nowRow = isToday ? (now - winStart) / 900_000 : null;
  const pastRows = isPast ? rows : nowRow != null ? Math.max(0, Math.min(rows, nowRow)) : 0;

  return (
    <div className="mt-3 rounded-2xl bg-surface border border-line overflow-hidden">
      <div className="grid relative" style={{ gridTemplateColumns: "3rem minmax(0, 1fr)", gridTemplateRows: `repeat(${rows}, ${DAY_ROW_REM}rem)` }}>
        {Array.from({ length: maxH - minH }, (_, h) => (
          <div key={`l${h}`} className={`text-[11px] text-muted text-right pr-2 tabular-nums ${h === 0 ? "pt-0.5" : "-translate-y-2"}`} style={{ gridColumn: 1, gridRow: `${h * 4 + 1} / span 4` }}>
            {String(minH + h).padStart(2, "0")}:00
          </div>
        ))}
        {Array.from({ length: maxH - minH }, (_, h) => (
          <div key={`g${h}`} className={`border-l border-line/60 ${h === 0 ? "" : "border-t"}`} style={{ gridColumn: 2, gridRow: `${h * 4 + 1} / span 4` }} />
        ))}
        {withLanes(events).map(({ e, lane, lanes }) => {
          const live = e.start <= now && now < e.end;
          return (
            <div
              key={e.id}
              className="m-0.5 rounded-lg border px-2 py-1 text-xs leading-snug overflow-hidden"
              style={{
                gridColumn: 2,
                gridRow: `${Math.max(1, rowOf(e.start))} / ${Math.min(rows + 1, rowOf(e.end))}`,
                width: lanes > 1 ? `calc(${100 / lanes}% - 4px)` : undefined,
                marginLeft: lanes > 1 ? `calc(${(lane * 100) / lanes}% + 2px)` : undefined,
                ...colorStyle(e),
              }}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold line-clamp-2">{e.title}</span>
                {live && <span className="text-[10px] font-semibold uppercase tracking-wide text-busy shrink-0">now</span>}
              </div>
              <div className="opacity-80 line-clamp-3">
                <span className="tabular-nums">{fmtTime(e.start)}–{fmtTime(e.end)}</span>
                {!e.masked && [KIND_LABEL[e.kind], e.rooms].filter(Boolean).map((x) => ` · ${x}`).join("")}
              </div>
            </div>
          );
        })}
        {pastRows > 0 && (
          <div className="pointer-events-none bg-foreground/[0.05]" style={{ gridColumn: 2, gridRow: 1, height: `${pastRows * DAY_ROW_REM}rem`, alignSelf: "start" }} />
        )}
        {nowRow != null && nowRow >= 0 && nowRow < rows && (
          <div className="pointer-events-none h-0.5 bg-accent" style={{ gridColumn: 2, gridRow: Math.floor(nowRow) + 1, marginTop: `${(nowRow % 1) * DAY_ROW_REM}rem` }} />
        )}
      </div>
    </div>
  );
}
