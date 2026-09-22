import Link from "next/link";
import { button, iconButton } from "@/lib/ui";
import { formatInTimeZone } from "date-fns-tz";
import { TZ, addDays, fmtWeekLabel } from "@/lib/time";

/**
 * Week switcher. Both arrows look the same; "Today" appears to their left only when you're on
 * another week, and the label has a fixed width, so the arrows never move under your finger.
 */
export function WeekNav({ weekStart, thisWeekStart, hrefFor }: { weekStart: number; thisWeekStart: number; hrefFor: (weekStart: number) => string }) {
  const offset = Math.round((weekStart - thisWeekStart) / (7 * 86_400_000));
  const label =
    offset === 0 ? "This week" : offset === 1 ? "Next week" : offset === -1 ? "Last week" : `Week of ${formatInTimeZone(weekStart, TZ, "d MMM")}`;
  return (
    <div className="flex items-center gap-1 text-sm">
      {offset !== 0 && (
        <Link href={hrefFor(thisWeekStart)} className={button("secondary", "sm", "mr-1 animate-in")}>
          Today
        </Link>
      )}
      <Link href={hrefFor(addDays(weekStart, -7))} aria-label="Previous week" className={iconButton()}>
        ‹
      </Link>
      <span className="h-8 w-[6.5rem] sm:w-32 inline-flex items-center justify-center font-bold whitespace-nowrap text-[13px] sm:text-sm" title={fmtWeekLabel(weekStart)}>
        {label}
      </span>
      <Link href={hrefFor(addDays(weekStart, 7))} aria-label="Next week" className={iconButton()}>
        ›
      </Link>
    </div>
  );
}
