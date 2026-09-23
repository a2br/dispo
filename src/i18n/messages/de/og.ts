import type { Messages } from "../en";

const og: Messages["og"] = {
  footer: "EPFL-Stundenpläne, nebeneinander",
  you: "Du",
  free: "Frei",
  busy: "Beschäftigt",
  hours: (n) => `${n} Std.`,
  freeSummary: (hours, from, to) => `${hours} frei zwischen ${from} und ${to}, Montag bis Freitag.`,
  freeBusy: "Frei / beschäftigt",
  someone: {
    title: "Jemandes Woche",
    subtitle: "Schau, wann diese Person frei ist. Ohne Anmeldung.",
  },
  invite: {
    alt: "Eine Einladung zu dispo",
    eyebrow: "Du bist eingeladen",
    title: "Schau, wann ihr beide frei seid",
    titleFrom: (first) => `${first} will sehen, wann ihr beide frei seid`,
    subtitle: "EPFL-Stundenpläne nebeneinander. Einmal mit dem EPFL-Konto anmelden.",
  },
  group: {
    alt: "Tritt einer Gruppe auf dispo bei",
    deadTitle: "Findet gemeinsam Zeit",
    deadSubtitle: "Schau, wann alle in deiner Gruppe frei sind.",
    soFar: (n) => `Bisher ${n} ${n === 1 ? "Person" : "Personen"}`,
    join: (name) => `Tritt „${name}“ bei`,
    subtitle: "Schau, wann alle zwischen den Vorlesungen frei sind. Ein Klick, EPFL-Login.",
  },
  home: {
    alt: "dispo: Schau, wann deine Freunde an der EPFL Zeit haben",
    title: "Wer hat gerade Zeit?",
    subtitle: "Die EPFL-Stundenpläne deiner Freunde nebeneinander. Mit einem Blick findest du Zeit.",
  },
};

export default og;
