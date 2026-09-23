import type { Messages } from "../en";

const now: Messages["now"] = {
  title: "Wer hat Zeit?",
  inviteCard: {
    title: "Lade Freunde ein",
    hide: "Einladungskarte ausblenden",
    hideShort: "Ausblenden",
    small: "Wer sich über deinen Einladungslink anmeldet, ist mit dir verbunden.",
  },
  searchPlaceholder: "Suche jemanden an der EPFL",
  onboarding: {
    title: "Leg mit dispo los",
    intro: "Zwei Schritte, und die freie Zeit deiner Freunde erscheint hier.",
    scheduleTitle: "Füge deinen Stundenplan hinzu",
    scheduleDetail: "Kopiere deinen Kalenderlink aus IS-Academia und füge ihn einmal ein; er bleibt synchronisiert.",
    scheduleButton: "Stundenplan hinzufügen",
    peopleTitle: "Hol deine Leute dazu",
    peopleDetail: "Suche oben nach Leuten oder schick deinen Link. Wer sich darüber anmeldet, ist automatisch mit dir verbunden.",
  },
  wantsToConnect: (n) => (n === 1 ? "Möchte dich hinzufügen" : "Möchten dich hinzufügen"),
  accept: "Annehmen",
  decline: "Ablehnen",
  yourPeople: "Deine Kontakte",
  freeNow: (n) => `${n} jetzt frei`,
  groups: "Gruppen",
  createGroup: "Gruppe erstellen",
  groupsEmpty: "Eine Gruppe ist wie ein Gruppenchat zum Terminfinden: Alle darin sehen, wann ihr alle frei seid, und es gibt einen Link für euren Chat.",
  classmates: "Mitstudierende",
  discover: "Entdecken",
  classmatesEmpty: "Aus deinen Kursen ist noch niemand dabei.",
  sharedCourses: (shared, total) => `${shared} von deinen ${total} ${total === 1 ? "Kurs" : "Kursen"}`,
  seeAllClassmates: (n) => `Alle ${n} in Entdecken ansehen`,
  requested: "Angefragt",
  pending: "ausstehend",
  groupCard: {
    noSlot: "Kein gemeinsames Zeitfenster in den nächsten 2 Wochen",
    freeNow: (until) => `Alle jetzt frei, bis ${until}`,
    freeToday: (range) => `Heute alle frei, ${range}`,
    freeTomorrow: (range) => `Morgen alle frei, ${range}`,
    freeOn: (day, range) => `Am ${day} alle frei, ${range}`,
    empty: "Noch niemand ist beigetreten",
    locked: "Füge deinen Stundenplan hinzu, um zu vergleichen",
  },
  groupInvite: {
    title: (inviter, group) => `${inviter} hat dich zu „${group}“ eingeladen`,
    members: (names, more) =>
      `${names.join(", ")}${more > 0 ? ` und ${more} weitere` : ""} ${names.length + more === 1 ? "ist" : "sind"} dabei.`,
    note: "Wenn du beitrittst, sieht die Gruppe, wann du frei bist (nur frei/beschäftigt).",
    decline: "Ablehnen",
    accept: "Annehmen",
    more: (n) => (n === 1 ? "Danach noch eine Einladung" : `Danach noch ${n} Einladungen`),
  },
  landing: {
    tagline: "Wer hat gerade Zeit? Sieh die EPFL-Stundenpläne deiner Freunde, so wie du bei der Arbeit kurz in den Teamkalender schaust.",
    steps: [
      "Melde dich mit deinem EPFL-Google-Konto an.",
      "Kopiere deinen Kalenderlink aus IS-Academia und füge ihn einmal ein.",
      "Lade Freunde oder einen Gruppenchat ein und sieh, wann alle frei sind.",
    ],
    members: (count, n) => `${count} ${n === 1 ? "Person an der EPFL nutzt" : "Leute an der EPFL nutzen"} dispo.`,
  },
};

export default now;
