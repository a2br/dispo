import { ImageResponse } from "next/og";
import { LOCALE_TAGS, type Locale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import type { Block } from "./blocks";
import { initials, toneFor } from "./present";
import { addDays, fmtDayNum, fmtDayShort, fmtWeekLabel, localParts } from "./time";

/**
 * Shared 1200×630 share cards in the app's EPFL-aligned style: white, square, red dot, canard for free.
 * Each card takes the locale of whoever shared the link (crawlers send no useful language of their own).
 */
export const ogSize = { width: 1200, height: 630 };

const INK = "#212121";
const MUTED = "#707070";
const LINE = "#e6e6e6";
const RED = "#ff0000";
const CANARD = "#007480";
const GROSEILLE = "#b51f1f";
const FREE_BG = "rgba(0,116,128,0.07)";
const BUSY_BG = "rgba(181,31,31,0.16)";

// A stylised week for the generic card: free (canard) and busy (groseille) blocks, same shape every time.
const WEEK: [number, number, "busy" | "free"][][] = [
  [[0, 2, "busy"], [3, 5, "free"], [6, 8, "busy"]],
  [[1, 3, "busy"], [4, 6, "busy"], [7, 9, "free"]],
  [[0, 1, "free"], [2, 4, "busy"], [5, 7, "free"]],
  [[1, 2, "busy"], [3, 6, "free"], [7, 8, "busy"]],
  [[0, 3, "free"], [4, 5, "busy"], [6, 9, "busy"]],
];

/** `#rrggbb` at `a` opacity: Satori has no color-mix(). */
function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

const wordmark = (
  <div key="w" style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
    dispo<span style={{ color: RED }}>.</span>
  </div>
);

const footer = (text: string) => (
  <div key="f" style={{ display: "flex", fontSize: 22, color: MUTED }}>
    {text}
  </div>
);

/**
 * Initials on a name-derived tone, like the in-app Avatar. `name` null draws the empty seat for the viewer.
 * `firstOnly` shows just the first initial, for cards that stick to first names.
 */
function Tile({ name, size, firstOnly, you = "" }: { name: string | null; size: number; firstOnly?: boolean; you?: string }) {
  const base = name ? toneFor(name).base : MUTED;
  const style = name ? { color: base, background: alpha(base, 0.13) } : { color: MUTED, border: `3px dashed ${LINE}` };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, fontSize: size * (name ? 0.38 : 0.26), fontWeight: 700, ...style }}>
      {name ? (firstOnly ? initials(name.split(" ")[0]) : initials(name)) : you}
    </div>
  );
}

function Copy({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {eyebrow && <div style={{ display: "flex", fontSize: 26, color: MUTED }}>{eyebrow}</div>}
      <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
      <div style={{ display: "flex", fontSize: 28, color: MUTED, lineHeight: 1.3 }}>{subtitle}</div>
    </div>
  );
}

// `left` is an array, not a fragment: Satori drops the column's flex layout for fragment children.
function frame(left: React.ReactNode[], right: React.ReactNode) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", padding: 64, fontFamily: "sans-serif", color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 520 }}>{left}</div>
        <div style={{ display: "flex", flex: 1, marginLeft: 48 }}>{right}</div>
      </div>
    ),
    ogSize,
  );
}

/** Generic card with a stylised week: the home page and dead links. */
export function shareCard({ locale, eyebrow, title, subtitle }: { locale: Locale; eyebrow?: string; title: string; subtitle: string }) {
  return frame(
    [wordmark, <Copy key="c" eyebrow={eyebrow} title={title} subtitle={subtitle} />, footer(messages[locale].og.footer)],
    <div style={{ display: "flex", flex: 1, border: `2px solid ${LINE}`, padding: 20, gap: 12 }}>
      {WEEK.map((day, d) => (
        <div key={d} style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative", borderLeft: d ? `1px solid ${LINE}` : "none" }}>
          {day.map(([a, b, kind], k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: 4,
                right: 4,
                top: `${(a / 9) * 100}%`,
                height: `${((b - a) / 9) * 100}%`,
                background: kind === "free" ? "rgba(0,116,128,0.14)" : BUSY_BG,
                borderLeft: `5px solid ${kind === "free" ? CANARD : GROSEILLE}`,
              }}
            />
          ))}
        </div>
      ))}
    </div>,
  );
}

/**
 * The people behind an invite, plus an empty seat for the viewer: the link's promise is "you, next to them".
 * Full names in, first names out: tones match the in-app avatars, but the card itself only shows first names.
 */
export function peopleCard({ locale, eyebrow, title, subtitle, people }: { locale: Locale; eyebrow?: string; title: string; subtitle: string; people: string[] }) {
  const t = messages[locale];
  const shown = people.slice(0, people.length > 8 ? 7 : 8);
  const extra = people.length - shown.length;
  const tiles = shown.length + (extra ? 1 : 0) + 1;
  const size = tiles <= 2 ? 200 : tiles <= 4 ? 170 : 124;
  const seat = (key: string | number, tile: React.ReactNode, label = "") => (
    <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {tile}
      <div style={{ display: "flex", height: 30, fontSize: 24, color: MUTED }}>{label}</div>
    </div>
  );
  return frame(
    [wordmark, <Copy key="c" eyebrow={eyebrow} title={title} subtitle={subtitle} />, footer(t.og.footer)],
    <div style={{ display: "flex", flex: 1, flexWrap: "wrap", alignItems: "center", alignContent: "center", justifyContent: "center", gap: 20 }}>
      {shown.map((p, i) => seat(i, <Tile name={p} size={size} firstOnly />, p.split(" ")[0]))}
      {extra > 0 &&
        seat(
          "more",
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, fontSize: size * 0.3, color: MUTED, background: "#f4f4f4" }}>+{extra}</div>,
        )}
      {seat("you", <Tile name={null} size={size} you={t.og.you} />)}
    </div>,
  );
}

/** Hours to the nearest half: "7.5 h", "7,5 h". */
const fmtHours = (min: number, locale: Locale) => messages[locale].og.hours((Math.round(min / 30) / 2).toLocaleString(LOCALE_TAGS[locale]));

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/**
 * The owner's real week, free/busy only (merged blocks, as the public page shows them), laid out
 * like WeekView: 08–19 unless events run outside it, weekend columns only when something is on them.
 */
export function weekCard({ locale, name, weekStart, blocks }: { locale: Locale; name: string; weekStart: number; blocks: Block[] }) {
  const t = messages[locale];
  const first = name.split(" ")[0];
  const dayCount = blocks.some((b) => localParts(b.start).day >= 5) ? 7 : 5;
  let minH = 8;
  let maxH = 19;
  for (const b of blocks) {
    minH = Math.min(minH, Math.floor(localParts(b.start).minutes / 60));
    const e = localParts(b.end).minutes;
    maxH = Math.max(maxH, Math.ceil((e === 0 ? 1440 : e) / 60));
  }
  const span = (maxH - minH) * 60;
  const byDay = Array.from({ length: dayCount }, () => [] as { a: number; b: number }[]);
  for (const bl of blocks) {
    const s = localParts(bl.start);
    if (s.day >= dayCount) continue;
    const e = localParts(bl.end);
    byDay[s.day].push({ a: s.minutes, b: e.day !== s.day ? maxH * 60 : e.minutes });
  }
  // Blocks are already merged, so summing them never counts an overlap twice.
  const busy = byDay.slice(0, 5).flat().reduce((sum, x) => sum + x.b - x.a, 0);
  const free = 5 * span - busy;
  const hourLabels = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i).filter((h) => h % 2 === 0);
  const swatch = (bg: string, border: string) => <div style={{ display: "flex", width: 22, height: 22, background: bg, borderLeft: border }} />;

  return frame(
    [
      wordmark,
      <div key="c" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <Tile name={name} size={84} />
        <Copy eyebrow={fmtWeekLabel(weekStart, locale)} title={t.share.weekOf(first)} subtitle={t.og.freeSummary(fmtHours(free, locale), hh(minH), hh(maxH))} />
      </div>,
      <div key="l" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, color: MUTED }}>
        {swatch(alpha(CANARD, 0.14), `5px solid ${alpha(CANARD, 0.14)}`)}
        <span style={{ marginRight: 18 }}>{t.og.free}</span>
        {swatch("#fbe9e9", `5px solid ${GROSEILLE}`)}
        <span>{t.og.busy}</span>
      </div>,
    ],
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", paddingLeft: 44, height: 44 }}>
        {byDay.map((_, d) => {
          const day = addDays(weekStart, d);
          // Seven columns are too narrow for "mer. 23" on one line: stack the weekday over the date.
          const stacked = dayCount === 7;
          return (
            <div
              key={d}
              style={{ display: "flex", flex: 1, flexDirection: stacked ? "column" : "row", alignItems: "center", justifyContent: "center", gap: stacked ? 0 : 6, fontSize: stacked ? 17 : 20, lineHeight: stacked ? 1.1 : 1.2, color: MUTED }}
            >
              {fmtDayShort(day, locale)}
              <span style={{ color: INK, fontWeight: 700 }}>{fmtDayNum(day)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ display: "flex", width: 44, position: "relative" }}>
          {hourLabels.map((h) => (
            <div key={h} style={{ display: "flex", position: "absolute", top: `${(((h - minH) * 60) / span) * 100}%`, marginTop: -11, fontSize: 18, color: MUTED }}>
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flex: 1, border: `2px solid ${LINE}` }}>
          {byDay.map((list, d) => (
            <div key={d} style={{ display: "flex", flex: 1, position: "relative", background: FREE_BG, borderLeft: d ? "2px solid #ffffff" : "none" }}>
              {list.map((x, k) => (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: `${((x.a - minH * 60) / span) * 100}%`,
                    height: `${((x.b - x.a) / span) * 100}%`,
                    background: "#fbe9e9",
                    borderLeft: `5px solid ${GROSEILLE}`,
                    borderTop: "2px solid #ffffff",
                    borderBottom: "2px solid #ffffff",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
  );
}
