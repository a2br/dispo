"use client";

import { useCallback, useState } from "react";
import { button } from "@/lib/ui";
import { addDays, dayStartOf, localParts } from "@/lib/time";
import { useT } from "@/i18n/client";
import { TimeBlockSheet } from "./TimeBlockSheet";

const HOUR = 3_600_000;

/** "Block time" in Calendar's header: opens the form at the next full hour (or 09:00 on the viewed week's Monday). */
export function TimeBlockButton({ weekStart, now }: { weekStart: number; now: number }) {
  const t = useT().calendar.blocks;
  const [slot, setSlot] = useState<{ start: number; end: number } | null>(null);
  const close = useCallback(() => setSlot(null), []);
  function open() {
    const thisWeek = now >= weekStart && now < weekStart + 7 * 24 * HOUR;
    let start = thisWeek ? Math.ceil(now / HOUR) * HOUR : weekStart + 9 * HOUR;
    // Late in the evening, suggest tomorrow morning: a block can't run past midnight.
    if (localParts(start).minutes > 22 * 60) start = addDays(dayStartOf(start), 1) + 9 * HOUR;
    setSlot({ start, end: start + HOUR });
  }
  return (
    <>
      <button type="button" onClick={open} className={button("add")}>
        + {t.add}
      </button>
      {slot && <TimeBlockSheet target={{ type: "new", ...slot }} onClose={close} />}
    </>
  );
}
