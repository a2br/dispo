"use client";

import { useState } from "react";
import { busyRuns, commonFree, dayWindow, hoursSpan, type Interval, type MemberData } from "@/lib/groupcalc";
import { addDays, fmtDayNum, fmtDayShort, fmtTime, localParts } from "@/lib/time";
import { useLocale, useT } from "@/i18n/client";
import { LOCALE_TAGS } from "@/i18n/config";
import { Avatar } from "./Avatar";

const DAYS = 5;

type Props = { weekStart: number; now: number; todayIndex: number | null; members: MemberData[] };

function SlotChip({ w }: { w: Interval }) {
  const t = useT();
  return (
    <span className="rounded-sm bg-free/10 text-free border border-free/30 px-1.5 py-0.5 text-xs font-bold tabular-nums whitespace-nowrap">
      {fmtTime(w.start)}–{fmtTime(w.end)}
      <span className="font-normal opacity-75"> · {t.common.duration(Math.round((w.end - w.start) / 60_000))}</span>
    </span>
  );
}

/**
 * Side-by-side free/busy for a group. Fills its container: the day grid's hour rows share the
 * available height so no scrolling is needed. Phones show the selected day's common slots in one
 * line; wider screens list the whole week beside the grid.
 */
export function GroupWeek({ weekStart, now, todayIndex, members }: Props) {
  const t = useT();
  const tc = t.calendar;
  const locale = useLocale();
  const dayStarts = Array.from({ length: DAYS }, (_, i) => addDays(weekStart, i));
  const [day, setDay] = useState(todayIndex != null && todayIndex < DAYS ? todayIndex : 0);

  const withCal = members.filter((m) => m.hasCalendar);
  const missing = members.filter((m) => !m.hasCalendar);
  const canCompare = withCal.length >= 2;

  // Suggestions within 08:00–19:00, never in the past.
  const free = dayStarts.map((ds) => commonFree(members, dayWindow(ds), now));
  const anyFree = free.some((f) => f.length > 0);

  const { fromH, toH } = hoursSpan(members, dayStarts, (ms) => localParts(ms).minutes / 60);
  const hours = toH - fromH;
  const rows = hours * 4;
  const win = dayWindow(dayStarts[day], fromH, toH);
  const runs = busyRuns(members, win);
  const rowOf = (ms: number) => Math.round((ms - win.start) / (15 * 60_000)) + 1;
  const span = win.end - win.start;
  const nowFrac = day === todayIndex ? (now - win.start) / span : null;
  const pastFrac = todayIndex == null ? (weekStart < now ? 1 : 0) : day < todayIndex ? 1 : day === todayIndex ? Math.max(0, Math.min(1, (now - win.start) / span)) : 0;
  const cols = `2.5rem minmax(3.5rem, 1.2fr) repeat(${members.length}, minmax(3rem, 1fr))`;
  const firstName = (m?: MemberData) => (m && !m.isSelf ? m.name.split(" ")[0] : null);

  const missingNote = missing.length > 0 && (
    <p className="text-xs text-muted">
      {tc.missing(new Intl.ListFormat(LOCALE_TAGS[locale], { type: "conjunction" }).format(missing.map((m) => m.name.split(" ")[0])), missing.length)}
    </p>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
      {/* Left on wide screens: the week's common slots + day tabs */}
      <div className="flex flex-col gap-2 shrink-0 lg:gap-4 lg:min-h-0">
        <section className="hidden lg:block">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-2">{tc.everyoneFree}</h2>
          {!canCompare ? (
            <p className="text-sm text-muted">{tc.needTwo}</p>
          ) : !anyFree ? (
            <p className="text-sm text-muted">{tc.noSlotWeek}</p>
          ) : (
            <ul className="border border-line divide-y divide-line">
              {dayStarts.map((ds, i) =>
                free[i].length === 0 ? null : (
                  <li key={i}>
                    <button onClick={() => setDay(i)} className={`w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-subtle ${i === day ? "bg-subtle" : ""}`}>
                      <span className="w-14 shrink-0 text-sm whitespace-nowrap">
                        <span className="font-bold">{fmtDayShort(ds, locale)}</span> <span className="text-muted">{fmtDayNum(ds)}</span>
                      </span>
                      <span className="flex flex-wrap gap-1">
                        {free[i].map((w) => (
                          <SlotChip key={w.start} w={w} />
                        ))}
                      </span>
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
          {missingNote && <div className="mt-2">{missingNote}</div>}
        </section>

        <div className="grid grid-cols-5 gap-1">
          {dayStarts.map((ds, i) => {
            const freeMs = free[i].reduce((s, w) => s + (w.end - w.start), 0);
            const isSel = i === day;
            return (
              <button
                key={i}
                onClick={() => setDay(i)}
                className={`py-1.5 flex flex-col items-center gap-0.5 border ${isSel ? "bg-foreground text-background border-foreground" : "bg-surface border-line"}`}
              >
                <span className={`text-[11px] uppercase tracking-wide ${isSel ? "opacity-80" : "text-muted"}`}>{fmtDayShort(ds, locale)}</span>
                <span className={`text-base font-bold leading-none ${i === todayIndex && !isSel ? "text-accent-ink" : ""}`}>{fmtDayNum(ds)}</span>
                <span className={`text-[10px] tabular-nums ${freeMs > 0 ? (isSel ? "" : "text-free font-bold") : "opacity-40"}`}>{freeMs > 0 ? t.common.duration(Math.round(freeMs / 60_000)) : "—"}</span>
              </button>
            );
          })}
        </div>

        {/* Phones: just the selected day's slots, one line */}
        <div className="lg:hidden flex items-center gap-2 min-h-7 overflow-hidden">
          {!canCompare ? (
            <span className="text-xs text-muted">{tc.needTwo}</span>
          ) : free[day].length === 0 ? (
            <span className="text-xs text-muted">{day === todayIndex ? tc.noSlotToday : tc.noSlotDay}</span>
          ) : (
            <>
              <span className="text-xs font-bold text-muted uppercase tracking-wide shrink-0">{tc.allFree}</span>
              <span className="flex gap-1 overflow-hidden">
                {free[day].map((w) => (
                  <SlotChip key={w.start} w={w} />
                ))}
              </span>
            </>
          )}
        </div>
        <div className="lg:hidden">{missingNote}</div>
      </div>

      {/* Day grid: combined column + one column per person, stretching to the available height */}
      <div className="flex flex-col flex-1 min-h-72 border border-line bg-surface overflow-x-auto">
        <div className="grid shrink-0 min-w-fit" style={{ gridTemplateColumns: cols }}>
          <div className="border-b border-line" />
          <div className="border-b border-l border-line px-1 py-1.5 text-center text-[11px] font-bold text-free self-stretch grid place-items-center">{tc.allColumn}</div>
          {members.map((m) => (
            <div key={m.id} className="border-b border-l border-line px-1 py-1.5 flex flex-col items-center gap-0.5 min-w-0">
              <Avatar name={m.name} size={20} />
              <span className="text-[11px] truncate max-w-full">{m.isSelf ? tc.you : m.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        <div key={day} className="relative flex-1 min-h-0 min-w-fit animate-fade">
          <div className="grid h-full" style={{ gridTemplateColumns: cols, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
            {Array.from({ length: hours }, (_, h) => (
              <div key={`l${h}`} className={`text-[10px] text-muted text-right pr-1.5 tabular-nums ${h === 0 ? "pt-0.5" : "-translate-y-1.5"}`} style={{ gridColumn: 1, gridRow: `${h * 4 + 1} / span 4` }}>
                {String(fromH + h).padStart(2, "0")}:00
              </div>
            ))}
            {Array.from({ length: hours * (members.length + 1) }, (_, k) => {
              const col = (k % (members.length + 1)) + 2;
              const h = Math.floor(k / (members.length + 1));
              return <div key={`c${k}`} className={`border-l border-line/70 ${h > 0 ? "border-t" : ""}`} style={{ gridColumn: col, gridRow: `${h * 4 + 1} / span 4` }} />;
            })}

            {/* combined column: everyone free (canard), all but one (warning) */}
            {canCompare &&
              runs.map((r) => {
                const everyone = r.busy === 0;
                const allButOne = !everyone && withCal.length >= 3 && r.busy === 1;
                if (!everyone && !allButOne) return null;
                const who = members.find((m) => m.id === r.busyIds[0]);
                return (
                  <div
                    key={`r${r.start}`}
                    className={`m-px px-1 py-0.5 text-[10px] leading-tight overflow-hidden ${everyone ? "bg-free/15 border border-free/40" : "bg-warn/15 border border-warn/50 text-warn-ink"}`}
                    style={{ gridColumn: 2, gridRow: `${rowOf(r.start)} / ${rowOf(r.end)}` }}
                    title={`${fmtTime(r.start)}–${fmtTime(r.end)} · ${everyone ? tc.everyoneFreeTitle : tc.allBut(firstName(who))}`}
                  >
                    {allButOne && r.end - r.start >= 45 * 60_000 && tc.allBut(firstName(who))}
                  </div>
                );
              })}

            {/* per-person busy blocks */}
            {members.map((m, i) =>
              !m.hasCalendar ? (
                <div
                  key={`n${m.id}`}
                  className="m-px text-[10px] text-muted grid place-items-center"
                  style={{ gridColumn: i + 3, gridRow: `1 / ${rows + 1}`, background: "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--muted) 15%, transparent) 6px 12px)" }}
                >
                  <span className="[writing-mode:vertical-rl] rotate-180">{tc.noSchedule}</span>
                </div>
              ) : (
                m.blocks
                  .filter((b) => b.end > win.start && b.start < win.end)
                  .map((b) => (
                    <div
                      key={`${m.id}${b.start}`}
                      className="m-px border"
                      style={{
                        gridColumn: i + 3,
                        gridRow: `${Math.max(1, rowOf(b.start))} / ${Math.min(rows + 1, rowOf(b.end))}`,
                        background: "color-mix(in oklab, var(--busy) 16%, var(--surface))",
                        borderColor: "color-mix(in oklab, var(--busy) 40%, var(--surface))",
                      }}
                      title={tc.busyTitle(m.isSelf ? null : m.name, `${fmtTime(b.start)}–${fmtTime(b.end)}`)}
                    />
                  ))
              ),
            )}
          </div>
          {pastFrac > 0 && <div className="pointer-events-none absolute top-0 right-0 left-[2.5rem] bg-background/60" style={{ height: `${pastFrac * 100}%` }} />}
          {nowFrac != null && nowFrac >= 0 && nowFrac <= 1 && <div className="pointer-events-none absolute right-0 left-[2.5rem] h-0.5 bg-accent" style={{ top: `${nowFrac * 100}%` }} />}
        </div>
      </div>
    </div>
  );
}
