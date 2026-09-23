import Link from "next/link";
import { button, iconButton } from "@/lib/ui";
import { ChevronLeft, ChevronRight } from "./Icons";
import { addDays, fmtDayMonth, fmtWeekLabel } from "@/lib/time";
import { getLocale, getT } from "@/i18n/server";

/** A Monday with a wide month name ("28 Sept"), to size the label for any dated week. */
const WIDE_WEEK = Date.UTC(2026, 8, 28, 12);

/**
 * Week switcher. Both arrows look the same; "Today" appears to their left only when you're on
 * another week, and the label is as wide as the language's longest one, so the arrows never move
 * under your finger.
 */
export async function WeekNav({ weekStart, thisWeekStart, hrefFor }: { weekStart: number; thisWeekStart: number; hrefFor: (weekStart: number) => string }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const w = t.calendar.week;
  const offset = Math.round((weekStart - thisWeekStart) / (7 * 86_400_000));
  const label = offset === 0 ? w.thisWeek : offset === 1 ? w.nextWeek : offset === -1 ? w.lastWeek : w.weekOf(fmtDayMonth(weekStart, locale));
  const sizers = [w.thisWeek, w.nextWeek, w.lastWeek, w.weekOf(fmtDayMonth(WIDE_WEEK, locale))];
  return (
    <div className="flex items-center gap-1 text-sm">
      {offset !== 0 && (
        <Link href={hrefFor(thisWeekStart)} className={button("secondary", "sm", "mr-1 animate-in")}>
          {w.today}
        </Link>
      )}
      <Link href={hrefFor(addDays(weekStart, -7))} aria-label={w.previousAria} className={iconButton()}>
        <ChevronLeft />
      </Link>
      {/* Every label stacked in one cell, only the current one visible: the widest sets the width. */}
      <span className="h-8 min-w-[6.5rem] sm:min-w-32 grid place-items-center font-bold whitespace-nowrap text-[13px] sm:text-sm" title={fmtWeekLabel(weekStart, locale)}>
        {sizers.map((s) => (
          <span key={s} aria-hidden className="invisible [grid-area:1/1]">
            {s}
          </span>
        ))}
        <span className="[grid-area:1/1]">{label}</span>
      </span>
      <Link href={hrefFor(addDays(weekStart, 7))} aria-label={w.nextAria} className={iconButton()}>
        <ChevronRight />
      </Link>
    </div>
  );
}
