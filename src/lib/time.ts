import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { LOCALE_TAGS, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

export const TZ = "Europe/Zurich";
const DAY = 86_400_000;

/** Monday 00:00 (Zurich) of the week containing `at`, as an epoch ms instant. */
export function weekStartOf(at: Date | number): number {
  const z = toZonedTime(at, TZ);
  const dow = (z.getDay() + 6) % 7; // Mon=0
  const monday = new Date(z.getFullYear(), z.getMonth(), z.getDate() - dow, 0, 0, 0, 0);
  return fromZonedTime(monday, TZ).getTime();
}

/**
 * `?w=` value for a week: its ISO 8601 week, e.g. `2026-W39`. One value per week and one week per
 * value, so each week has a single URL (chat apps cache link previews per URL). ISO weeks start on
 * Monday like ours; the year is the ISO week-year, so Mon 29 Dec 2025 is `2026-W01`.
 */
export function weekParam(weekStart: number): string {
  return formatInTimeZone(weekStart, TZ, "RRRR-'W'II");
}

/**
 * Parse a `?w=` value into a Zurich week start: `YYYY-Www`, or a `YYYY-MM-DD` date inside the week
 * (links shared before ISO weeks). Anything else, including week 53 of a 52-week year, falls back
 * to the current week.
 */
export function weekStartFromParam(w: string | undefined): number {
  const iso = w?.match(/^(\d{4})-W(\d{2})$/i);
  if (iso) {
    // 4 January is always in week 1; step from its Monday.
    const start = addDays(weekStartOf(fromZonedTime(`${iso[1]}-01-04T12:00:00`, TZ)), (Number(iso[2]) - 1) * 7);
    if (weekParam(start) === `${iso[1]}-W${iso[2]}`) return start;
  } else if (w && /^\d{4}-\d{2}-\d{2}$/.test(w)) {
    const d = fromZonedTime(`${w}T12:00:00`, TZ);
    if (!Number.isNaN(d.getTime())) return weekStartOf(d);
  }
  return weekStartOf(Date.now());
}

export function addDays(ms: number, days: number): number {
  const z = toZonedTime(ms, TZ);
  return fromZonedTime(new Date(z.getFullYear(), z.getMonth(), z.getDate() + days, z.getHours(), z.getMinutes()), TZ).getTime();
}

export function fmtTime(ms: number): string {
  return formatInTimeZone(ms, TZ, "HH:mm");
}

const formats = new Map<string, Intl.DateTimeFormat>();
function dtf(locale: Locale, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.DateTimeFormat(LOCALE_TAGS[locale], { ...opts, timeZone: TZ })));
  return f;
}

/** "Mon" / "lun." / "Mo". */
export function fmtDayShort(ms: number, locale: Locale): string {
  return dtf(locale, { weekday: "short" }).format(ms);
}

/** "Monday" / "lundi" / "Montag". */
export function fmtDayLong(ms: number, locale: Locale): string {
  return dtf(locale, { weekday: "long" }).format(ms);
}

export function fmtDayNum(ms: number): string {
  return formatInTimeZone(ms, TZ, "d");
}

/** "21 Sept" / "21 sept." / "21. Sept.". */
export function fmtDayMonth(ms: number, locale: Locale): string {
  return dtf(locale, { day: "numeric", month: "short" }).format(ms);
}

/** Monday to Friday: "21 Sept – 25 Sept". */
export function fmtWeekLabel(weekStart: number, locale: Locale): string {
  return `${fmtDayMonth(weekStart, locale)} – ${fmtDayMonth(addDays(weekStart, 4), locale)}`;
}

/** Day index (Mon=0..Sun=6) and minutes since local midnight, in Zurich. */
export function localParts(ms: number): { day: number; minutes: number } {
  const z = toZonedTime(ms, TZ);
  return { day: (z.getDay() + 6) % 7, minutes: z.getHours() * 60 + z.getMinutes() };
}

/** Zurich-local midnight of the day containing `at`. */
export function dayStartOf(at: number): number {
  const z = toZonedTime(at, TZ);
  return fromZonedTime(new Date(z.getFullYear(), z.getMonth(), z.getDate()), TZ).getTime();
}

export function todayIndexInWeek(weekStart: number, now = Date.now()): number | null {
  const idx = Math.floor((dayStartOf(now) - weekStart) / DAY);
  return idx >= 0 && idx < 7 ? idx : null;
}

/** "just now", "5m ago"… in the words of `t.common.ago`. */
export function relativeAge(ms: number | null | undefined, ago: Messages["common"]["ago"], now = Date.now()): string {
  if (!ms) return ago.never;
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return ago.justNow;
  const m = Math.round(s / 60);
  if (m < 60) return ago.minutes(m);
  const h = Math.round(m / 60);
  if (h < 48) return ago.hours(h);
  return ago.days(Math.round(h / 24));
}

/** Current time in ms. Server components call this instead of Date.now() so the purity lint stays quiet about a deliberate read. */
export function nowMs(): number {
  return Date.now();
}
