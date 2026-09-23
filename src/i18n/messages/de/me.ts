import type { Messages } from "../en";

const me: Messages["me"] = {
  rightNow: "Gerade jetzt",
  myWeek: "Meine Woche",
  visibility: {
    title: "Wer meinen Stundenplan sieht",
    everyone: { title: "Alle an der EPFL (Standard)", desc: "Alle Angemeldeten sehen deinen Stundenplan, wie einen geteilten Arbeitskalender." },
    connections: { title: "Details für Kontakte", desc: "Alle sehen frei/beschäftigt; nur Personen, die du annimmst, sehen Kurse und Räume." },
    private: {
      title: "Nur Kontakte",
      desc: "Nur Personen, die du angenommen hast, sehen deinen Stundenplan. Man findet dich trotzdem über deinen Namen und kann dir eine Anfrage schicken.",
    },
  },
  inviteTitle: "Einladungslink",
  publicLink: {
    title: "Öffentlicher Link",
    blurb: "Ein Link zu deiner Woche, den alle ohne Anmeldung ansehen können: nur frei/beschäftigt, keine Kursnamen oder Räume.",
    textThisWeek: "Wann ich diese Woche frei bin:",
    textNextWeek: "Wann ich nächste Woche frei bin:",
    share: "Link teilen",
    preview: "Vorschau ↗",
    reset: "Neuer Link",
    resetHint: "Erstellt einen neuen Link; der alte funktioniert dann nicht mehr",
    turnOff: "Ausschalten",
    create: "Öffentlichen Link erstellen",
  },
  discover: {
    title: "Entdecken",
    toggle: "Mich in Entdecken zeigen",
    toggleHint:
      "Personen mit gemeinsamen Kursen finden dich dort, und du findest sie. Ausgeschaltet verschwindest du aus Entdecken und es wird für dich ausgeblendet. Die Namenssuche richtet sich nach deiner Sichtbarkeit oben.",
  },
  phone: {
    label: "Telefonnummer",
    optional: "(optional)",
    hint: "Sichtbar für Mitstudierende in Entdecken und für deine Kontakte, damit sie dir schreiben können. Leer lassen, um sie zu verbergen.",
    invalid: "Das sieht nicht nach einer Telefonnummer aus.",
    saved: "Gespeichert",
    removed: "Entfernt",
  },
  calendar: {
    title: "Kalenderlink",
    sessions: "Geladene Lektionen",
    lastSynced: "Zuletzt synchronisiert",
    lastError: (error) => `Letzte Aktualisierung fehlgeschlagen: ${error}`,
    refresh: "Jetzt aktualisieren",
    viewWeek: "Meine Woche ansehen",
    replace: "Link ersetzen",
    remove: "Meinen Stundenplan entfernen",
    none: "Noch kein Kalender.",
  },
  signOut: "Abmelden",
  openSource: "dispo ist Open Source.",
  viewCode: "Code auf GitHub ansehen ↗",
};

export default me;
