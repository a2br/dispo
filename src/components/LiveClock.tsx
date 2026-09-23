"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/i18n/client";
import { LOCALE_TAGS } from "@/i18n/config";

/**
 * "Tuesday 14:05" / "mardi 14:05" / "Dienstag, 14:05", ticking on each minute boundary. Starts from the server's `now` so hydration matches.
 * Coming back to a tab that sat in the background also refreshes the page, so the statuses next to it catch up.
 */
export function LiveClock({ now, className }: { now: number; className?: string }) {
  const router = useRouter();
  const [ms, setMs] = useState(now);
  const locale = useLocale();
  const fmt = useMemo(() => new Intl.DateTimeFormat(LOCALE_TAGS[locale], { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" }), [locale]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setMs(Date.now());
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();

    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      clearTimeout(timer);
      tick();
      if (hiddenAt && Date.now() - hiddenAt > 60_000) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return (
    <time dateTime={new Date(ms).toISOString()} className={className} suppressHydrationWarning>
      {fmt.format(ms)}
    </time>
  );
}
