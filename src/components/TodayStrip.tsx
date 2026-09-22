import { dayWindow } from "@/lib/groupcalc";

const FROM_H = 8;
const TO_H = 19;

/** A one-line picture of someone's day, 08:00–19:00: busy in red, now as a line. */
export function TodayStrip({ blocks, dayStart, now, known }: { blocks: { start: number; end: number }[]; dayStart: number; now: number; known: boolean }) {
  const win = dayWindow(dayStart, FROM_H, TO_H);
  const span = win.end - win.start;
  const pct = (t: number) => `${(Math.min(Math.max(t, win.start), win.end) - win.start) / span * 100}%`;
  const nowIn = now >= win.start && now <= win.end;
  return (
    <div className="relative h-6 w-full rounded-md bg-free/10 overflow-hidden" aria-hidden>
      {!known && <div className="absolute inset-0 bg-background" style={{ background: "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--muted) 15%, transparent) 6px 12px)" }} />}
      {Array.from({ length: TO_H - FROM_H - 1 }, (_, i) => (
        <div key={i} className="absolute inset-y-0 w-px bg-line/70" style={{ left: `${((i + 1) / (TO_H - FROM_H)) * 100}%` }} />
      ))}
      {blocks
        .filter((b) => b.end > win.start && b.start < win.end)
        .map((b) => (
          <div
            key={b.start}
            className="absolute inset-y-0.5 rounded-sm"
            style={{ left: pct(b.start), width: `calc(${pct(b.end)} - ${pct(b.start)})`, background: "color-mix(in oklab, var(--busy) 55%, transparent)" }}
          />
        ))}
      {now > win.start && <div className="absolute inset-y-0 left-0 bg-background/50" style={{ width: pct(now) }} />}
      {nowIn && <div className="absolute inset-y-0 w-0.5 bg-accent" style={{ left: pct(now) }} />}
    </div>
  );
}

export function TodayScale() {
  return (
    <div className="relative h-4 w-full text-[10px] text-muted tabular-nums">
      {[8, 10, 12, 14, 16, 18].map((h) => (
        <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h - FROM_H) / (TO_H - FROM_H)) * 100}%` }}>
          {String(h).padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}
