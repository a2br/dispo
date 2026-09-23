import type { Messages } from "../en";

const common: Messages["common"] = {
  today: "heute",
  tomorrow: "morgen",
  now: "jetzt",
  save: "Speichern",
  saved: "Gespeichert",
  cancel: "Abbrechen",
  back: "Zurück",
  pinned: "Angeheftet",
  epfl: "EPFL",
  invite: {
    text: "Schau, wann wir beide zwischen den Vorlesungen frei sind:",
    share: "Meinen Link teilen",
    short: "Einladen",
    blurb: "Wer sich über deinen Link anmeldet, ist sofort mit dir verbunden.",
  },
  ago: {
    never: "nie",
    justNow: "gerade eben",
    minutes: (n) => `vor ${n} Min.`,
    hours: (n) => `vor ${n} Std.`,
    days: (n) => `vor ${n} ${n === 1 ? "Tag" : "Tagen"}`,
  },
  duration: (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h === 0 ? `${m} Min.` : m === 0 ? `${h} Std.` : `${h} Std. ${String(m).padStart(2, "0")}`;
  },
};

export default common;
