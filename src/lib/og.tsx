import { ImageResponse } from "next/og";

/** Shared 1200×630 share card in the app's EPFL-aligned style: white, square, red dot, canard for free. */
export const ogSize = { width: 1200, height: 630 };

const INK = "#212121";
const MUTED = "#707070";
const LINE = "#e6e6e6";
const RED = "#ff0000";
const CANARD = "#007480";
const GROSEILLE = "#b51f1f";

// A stylised week: free (canard) and busy (groseille) blocks, same shape every time.
const WEEK: [number, number, "busy" | "free"][][] = [
  [[0, 2, "busy"], [3, 5, "free"], [6, 8, "busy"]],
  [[1, 3, "busy"], [4, 6, "busy"], [7, 9, "free"]],
  [[0, 1, "free"], [2, 4, "busy"], [5, 7, "free"]],
  [[1, 2, "busy"], [3, 6, "free"], [7, 8, "busy"]],
  [[0, 3, "free"], [4, 5, "busy"], [6, 9, "busy"]],
];

export function shareCard({ eyebrow, title, subtitle, people = [] }: { eyebrow?: string; title: string; subtitle: string; people?: string[] }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", padding: 64, fontFamily: "sans-serif", color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            dispo<span style={{ color: RED }}>.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {eyebrow && <div style={{ display: "flex", fontSize: 26, color: MUTED }}>{eyebrow}</div>}
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
            <div style={{ display: "flex", fontSize: 30, color: MUTED, lineHeight: 1.3 }}>{subtitle}</div>
            {people.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {people.slice(0, 6).map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 56, padding: "0 18px", border: `2px solid ${LINE}`, fontSize: 26, fontWeight: 700 }}>
                    {p}
                  </div>
                ))}
                {people.length > 6 && <div style={{ display: "flex", alignItems: "center", fontSize: 26, color: MUTED }}>+{people.length - 6}</div>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: MUTED }}>EPFL timetables, side by side</div>
        </div>
        <div style={{ display: "flex", flex: 1, marginLeft: 48, border: `2px solid ${LINE}`, padding: 20, gap: 12 }}>
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
                    background: kind === "free" ? "rgba(0,116,128,0.14)" : "rgba(181,31,31,0.16)",
                    borderLeft: `5px solid ${kind === "free" ? CANARD : GROSEILLE}`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    ogSize,
  );
}
