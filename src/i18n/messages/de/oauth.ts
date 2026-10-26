import type { Messages } from "../en";

const oauth: Messages["oauth"] = {
  title: "Assistenten verbinden",
  headline: (app) => `${app} Zugriff auf dein dispo geben`,
  intro: "Er sieht, was du in der App siehst, in deinem Namen:",
  sees: [
    "deine Woche: Kurse, Räume und die Zeit, die du blockiert oder freigegeben hast",
    "wer frei ist unter den Leuten, deren Stundenplan du sehen kannst",
    "wann du und andere alle frei seid",
  ],
  readOnly: "Nur Lesen: Er kann nichts ändern, keine Anfragen senden und niemandem schreiben.",
  backTo: (host) => `Danach geht es zurück zu ${host}.`,
  signedInAs: (email) => `Angemeldet als ${email}`,
  signInFirst: "Melde dich mit deinem EPFL-Konto an, um fortzufahren.",
  allow: "Erlauben",
  cancel: "Abbrechen",
  expired: { title: "Dieser Link ist abgelaufen", text: "Starte die Verbindung erneut in deinem Assistenten." },
};

export default oauth;
