import type { Messages } from "../en";

/** "Annas", "Lukas’": names ending in s, x or z take only an apostrophe. */
const genitive = (name: string) => (/[sxz]$/i.test(name) ? `${name}’` : `${name}s`);

const share: Messages["share"] = {
  weekOf: (first) => `${genitive(first)} Woche`,
  noSchedule: (first) => `${first} hat noch keinen Stundenplan hinzugefügt.`,
  findTime: (first) => `Zeit mit ${first} finden`,

  person: {
    title: "Person",
    addToSee: "Füge deinen Stundenplan hinzu, um ihn zu sehen",
    worksBothWays: "Stundenpläne gelten in beide Richtungen: Füge deinen hinzu, um auch Leute zu sehen, die noch nicht zu deinen Kontakten gehören. Kontakte sehen sich immer gegenseitig.",
    onlyAccepted: (first) => `Nur Leute, die ${first} angenommen hat, sehen den Stundenplan. Schick eine Kontaktanfrage.`,
    addMine: "Stundenplan hinzufügen",
    compare: "Vergleichen",
    noCommon: "Keine gemeinsamen Kurse mit dir.",
    sharesCourses: (shared, mine) => (mine === 1 ? "Besucht deinen Kurs" : `Besucht ${shared} deiner ${mine} Kurse`),
    synced: (age) => `Synchronisiert ${age}`,
    refreshFailed: "letzte Aktualisierung fehlgeschlagen",
  },

  schedule: {
    title: "Stundenplan",
    imageAlt: (first) => `${genitive(first)} Woche auf dispo`,
    description: (first, week) => `Wann ${first} frei und beschäftigt ist, ${week}. Schau auf dispo, wann ihr beide frei seid.`,
    compareMine: "Mit meinem vergleichen",
    bothFree: "Schau, wann wir beide frei sind",
    signInBlurb: (first) =>
      `Melde dich mit deinem EPFL-Konto an und füge deinen Stundenplan einmal hinzu. Du bist dann mit ${first} verbunden und siehst beide Wochen nebeneinander.`,
  },

  invite: {
    title: "Einladung",
    invitedYou: (first) => `${first} lädt dich zu dispo ein`,
    description: (first) => `Schau, wann du und ${first} zwischen den Vorlesungen frei seid. Melde dich mit deinem EPFL-Konto an.`,
    yourLink: "Das ist dein Einladungslink",
    yourLinkBlurb: "Wer an der EPFL ihn öffnet und sich anmeldet, ist sofort mit dir verbunden. So seht ihr gegenseitig eure freie Zeit.",
    backHome: "Zurück zu dispo",
    from: "Einladung von",
    headline: (first) => `Schau, wann du und ${first} frei seid.`,
    pitch: "dispo zeigt eure EPFL-Stundenpläne nebeneinander. So findest du mit einem Blick eine Lücke fürs Mittagessen oder ein Projekttreffen.",
    connect: (first) => `${first} hinzufügen`,
  },
};

export default share;
