"use client";

import { useState } from "react";
import { busyRuns, commonFree, dayWindow, hoursSpan, type MemberData } from "@/lib/groupcalc";
import { addDays, fmtDayNum, fmtDayShort, fmtTime, localParts } from "@/lib/time";
import { Avatar } from "./Avatar";

const ROW_REM = 0.85; // height of one 15-minute row
const DAYS = 5;

type Props = { weekStart: number; now: number; todayIndex: number | null; members: MemberData[] };

function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60_000);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h === 0 ? `${r} min` : r === 0 ? `${h} h` : `${h} h ${r}`;
}

export function GroupWeek({ weekStart, now, todayIndex, members }: Props) {
  const dayStarts = Array.from({ length: DAYS }, (_, i) => addDays(weekStart, i));
  const firstUsefulDay = todayIndex != null && todayIndex < DAYS ? todayIndex : 0;
  const [day, setDay] = useState(firstUsefulDay);

  const withCal = members.filter((m) => m.hasCalendar);
  const missing = members.filter((m) => !m.hasCalendar);

  // Suggestions within 08:00–19:00, never in the past.
  const free = dayStarts.map((ds) => commonFree(members, dayWindow(ds), now));
  const upcoming = free.flatMap((ws, i) => ws.map((w) => ({ ...w, day: i })));

  const { fromH, toH } = hoursSpan(members, dayStarts, (ms) => localParts(ms).minutes / 60);
  const win = dayWindow(dayStarts[day], fromH, toH);
  const rows = (toH - fromH) * 4;
  const runs = busyRuns(members, win);
  const rowOf = (ms: number) => Math.round((ms - win.start) / (15 * 60_000)) + 1;
  const nowRow = day === todayIndex && now >= win.start && now < win.end ? (now - win.start) / (15 * 60_000) : null;
  // Grey out what has already happened: whole earlier days, or today up to now.
  const pastEnd = todayIndex == null ? (weekStart < now ? win.end : null) : day < todayIndex ? win.end : day === todayIndex ? Math.min(now, win.end) : null;
  const pastRows = pastEnd != null && pastEnd > win.start ? (pastEnd - win.start) / (15 * 60_000) : 0;

  return (
    <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6 lg:items-start">
      <div className="space-y-5 lg:sticky lg:top-10">
      {/* Suggestions */}
      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Everyone free</h2>
        {withCal.length < 2 ? (
          <p className="rounded-2xl bg-surface border border-line px-4 py-4 text-sm text-muted">Need at least two people with a schedule to compare.</p>
        ) : upcoming.length === 0 ? (
          <p className="rounded-2xl bg-surface border border-line px-4 py-4 text-sm text-muted">No common slot of 30 min or more between 08:00 and 19:00 left this week.</p>
        ) : (
          <ul className="rounded-2xl bg-surface border border-line divide-y divide-line">
            {dayStarts.map((ds, i) =>
              free[i].length === 0 ? null : (
                <li key={i}>
                  <button onClick={() => setDay(i)} className={`w-full flex items-start gap-3 px-4 py-2.5 text-left active:opacity-70 ${i === day ? "bg-free/5" : ""}`}>
                    <span className="w-16 shrink-0 text-sm whitespace-nowrap">
                      <span className="font-semibold">{fmtDayShort(ds)}</span> <span className="text-muted">{fmtDayNum(ds)}</span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {free[i].map((w) => (
                        <span key={w.start} className="rounded-full bg-free/12 text-free border border-free/30 px-2 py-0.5 text-xs font-semibold tabular-nums">
                          {fmtTime(w.start)}–{fmtTime(w.end)}
                          <span className="font-normal opacity-75"> · {fmtDuration(w.end - w.start)}</span>
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
        {missing.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            {missing.map((m) => m.name.split(" ")[0]).join(", ")} {missing.length === 1 ? "hasn’t" : "haven’t"} added a schedule, so {missing.length === 1 ? "isn’t" : "aren’t"} counted.
          </p>
        )}
      </section>

      {/* Day tabs */}
      <div className="grid grid-cols-5 gap-1">
        {dayStarts.map((ds, i) => {
          const freeMs = free[i].reduce((s, w) => s + (w.end - w.start), 0);
          const isSel = i === day;
          return (
            <button
              key={i}
              onClick={() => setDay(i)}
              className={`rounded-2xl py-2 flex flex-col items-center gap-0.5 border ${isSel ? "bg-foreground text-background border-foreground" : "bg-surface border-line"}`}
            >
              <span className={`text-[11px] uppercase tracking-wide ${isSel ? "opacity-80" : "text-muted"}`}>{fmtDayShort(ds)}</span>
              <span className={`text-base font-semibold ${i === todayIndex && !isSel ? "text-accent" : ""}`}>{fmtDayNum(ds)}</span>
              <span className={`text-[10px] tabular-nums ${freeMs > 0 ? (isSel ? "" : "text-free") : "opacity-50"}`}>{freeMs > 0 ? fmtDuration(freeMs) : "—"}</span>
            </button>
          );
        })}
      </div>

      </div>

      <div className="space-y-3 min-w-0">
      {/* Day grid: one column per person, plus the combined column */}
      <div className="rounded-2xl bg-surface border border-line overflow-x-auto">
        <div
          className="grid min-w-full"
          style={{ gridTemplateColumns: `2.75rem minmax(4.5rem, 1.3fr) repeat(${members.length}, minmax(3.25rem, 1fr))` }}
        >
          {/* header */}
          <div className="sticky left-0 z-10 bg-surface border-b border-line" />
          <div className="border-b border-l border-line px-1 py-2 text-center text-[11px] font-semibold text-free">All</div>
          {members.map((m) => (
            <div key={m.id} className="border-b border-l border-line px-1 py-2 flex flex-col items-center gap-1 min-w-0">
              {m.isSelf ? (
                <span className="size-6 rounded-full bg-foreground text-background grid place-items-center text-[9px] font-semibold">You</span>
              ) : (
                <Avatar name={m.name} image={m.image} size={24} />
              )}
              <span className="text-[11px] truncate max-w-full">{m.isSelf ? "You" : m.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        <div
          className="grid relative min-w-full"
          style={{
            gridTemplateColumns: `2.75rem minmax(4.5rem, 1.3fr) repeat(${members.length}, minmax(3.25rem, 1fr))`,
            gridTemplateRows: `repeat(${rows}, ${ROW_REM}rem)`,
          }}
        >
          {/* hour lines + labels */}
          {Array.from({ length: toH - fromH }, (_, h) => (
            <div key={`l${h}`} className="sticky left-0 z-10 bg-surface text-[10px] text-muted text-right pr-1.5 -translate-y-1.5" style={{ gridColumn: 1, gridRow: `${h * 4 + 1} / span 4` }}>
              {String(fromH + h).padStart(2, "0")}:00
            </div>
          ))}
          {Array.from({ length: (toH - fromH) * (members.length + 1) }, (_, k) => {
            const col = (k % (members.length + 1)) + 2;
            const h = Math.floor(k / (members.length + 1));
            return <div key={`c${k}`} className="border-t border-l border-line/60" style={{ gridColumn: col, gridRow: `${h * 4 + 1} / span 4` }} />;
          })}

          {/* combined column */}
          {runs.map((r) => {
            const everyone = r.busy === 0 && withCal.length > 0;
            const allButOne = !everyone && withCal.length >= 3 && r.busy === 1;
            if (!everyone && !allButOne) return null;
            const who = members.find((m) => m.id === r.busyIds[0]);
            return (
              <div
                key={`r${r.start}`}
                className={`m-px rounded-md px-1 py-0.5 text-[10px] leading-tight overflow-hidden ${everyone ? "bg-free/20 border border-free/50 text-free font-semibold" : "bg-amber-400/15 border border-amber-500/30 text-amber-700 dark:text-amber-300"}`}
                style={{ gridColumn: 2, gridRow: `${rowOf(r.start)} / ${rowOf(r.end)}` }}
                title={`${fmtTime(r.start)}–${fmtTime(r.end)} · ${everyone ? "everyone free" : `all but ${who?.isSelf ? "you" : who?.name}`}`}
              >
                {r.end - r.start >= 45 * 60_000 && (everyone ? `${fmtTime(r.start)}–${fmtTime(r.end)}` : `all but ${who?.isSelf ? "you" : who?.name.split(" ")[0]}`)}
              </div>
            );
          })}

          {/* per-person busy blocks */}
          {members.map((m, i) =>
            !m.hasCalendar ? (
              <div
                key={`n${m.id}`}
                className="m-px rounded-md text-[10px] text-muted grid place-items-center"
                style={{ gridColumn: i + 3, gridRow: `1 / ${rows + 1}`, background: "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--muted) 15%, transparent) 6px 12px)" }}
              >
                <span className="[writing-mode:vertical-rl] rotate-180">no schedule</span>
              </div>
            ) : (
              m.blocks
                .filter((b) => b.end > win.start && b.start < win.end)
                .map((b) => (
                  <div
                    key={`${m.id}${b.start}`}
                    className="m-px rounded-md border px-1 py-0.5 text-[10px] leading-tight overflow-hidden"
                    style={{
                      gridColumn: i + 3,
                      gridRow: `${Math.max(1, rowOf(b.start))} / ${Math.min(rows + 1, rowOf(b.end))}`,
                      background: "color-mix(in oklab, var(--busy) 14%, transparent)",
                      borderColor: "color-mix(in oklab, var(--busy) 35%, transparent)",
                      color: "var(--busy)",
                    }}
                    title={`${m.isSelf ? "You" : m.name}: busy ${fmtTime(b.start)}–${fmtTime(b.end)}`}
                  >
                    {b.end - b.start >= 60 * 60_000 && <span className="tabular-nums">{fmtTime(b.start)}</span>}
                  </div>
                ))
            ),
          )}

          {pastRows > 0 && (
            <div
              className="pointer-events-none z-[5] bg-background/55"
              style={{ gridColumn: `2 / ${members.length + 3}`, gridRow: `1 / ${Math.min(rows, Math.ceil(pastRows)) + 1}`, height: pastRows < rows ? `${pastRows * ROW_REM}rem` : undefined, alignSelf: "start" }}
            />
          )}

          {nowRow != null && (
            <div
              className="pointer-events-none h-0.5 bg-accent z-10"
              style={{ gridColumn: `2 / ${members.length + 3}`, gridRow: Math.floor(nowRow) + 1, marginTop: `${(nowRow % 1) * ROW_REM}rem` }}
            />
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted text-center">Sessions starting at :15 count from the full hour. Green is everyone free{withCal.length >= 3 ? ", amber is all but one" : ""}.</p>
      </div>
    </div>
  );
}
