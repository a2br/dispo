import type { Messages } from "../en";

const pages: Messages["pages"] = {
  backTo: (label) => `Zurück zu ${label}`,
  share: { label: "Link teilen", copied: "Link kopiert", retry: "Nochmals versuchen", prompt: "Kopiere diesen Link" },
  notFound: {
    title: "Hier ist nichts",
    text: "Diese Seite gibt es nicht, oder sie ist für dich nicht sichtbar.",
    home: "Zur Startseite",
  },
  privacy: {
    title: "Datenschutz",
    updated: (date) => `Zuletzt aktualisiert am ${date}`,
    intro:
      "dispo ist ein kleines Studierendenprojekt, das Freunden an der EPFL zeigt, wann die anderen frei sind. Es ist nicht mit der EPFL verbunden. Diese Seite erklärt, was gespeichert wird und warum.",
    stores: {
      title: "Was dispo speichert",
      google: "Aus der Google-Anmeldung: dein Name und deine @epfl.ch-E-Mail-Adresse. Sonst nichts aus deinem Google-Konto, nicht einmal dein Profilbild.",
      link: "Der Kalenderlink, den du aus IS-Academia einfügst, verschlüsselt (AES-256-GCM). Er wird nie jemandem angezeigt, auch dir nicht, nachdem du ihn gespeichert hast.",
      classes: "Die Lektionen in diesem Kalender (Kurs, Zeit, Raum, Lehrperson), mehrmals täglich aktualisiert.",
      app: "Was du in der App einrichtest: Kontakte, Gruppen, angeheftete Personen, Sichtbarkeitseinstellungen, deine Sprache und, falls du eine angibst, deine Telefonnummer.",
    },
    who: {
      title: "Wer es sieht",
      before: "Andere angemeldete Personen sehen deinen Stundenplan gemäss deiner Einstellung in ",
      profile: "deinem Profil",
      after:
        ": alle an der EPFL (Standard), frei/beschäftigt für alle und Details nur für deine Kontakte, oder nur Kontakte. Ein öffentlicher Link, falls du einen erstellst, zeigt nur frei/beschäftigt, ohne Kursnamen oder Räume. Deine Daten werden nicht verkauft, nicht an Dritte weitergegeben und nicht für Werbung verwendet.",
    },
    where: {
      title: "Wo die Daten liegen",
      text: "Die App läuft auf Vercel und die Datenbank auf Turso, beide in der EU (Irland). Ein Session-Cookie hält dich angemeldet und ein Sprach-Cookie merkt sich deine Sprache; es gibt keine Analyse- oder Tracking-Cookies.",
    },
    delete: {
      title: "Deine Daten löschen",
      before: "Schreib eine E-Mail an ",
      after: " von deiner EPFL-Adresse aus, dann werden dein Konto und alles, was damit verknüpft ist, gelöscht.",
    },
  },
};

export default pages;
