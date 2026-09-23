import type { Messages } from "../en";

const people: Messages["people"] = {
  search: {
    placeholder: "Suche jemanden an der EPFL nach Namen",
    searching: "Suche läuft…",
    notOnDispo: "Noch nicht auf dispo",
    profile: "Profil",
    typeMore: "Niemand auf dispo passt. Tipp etwas mehr, um im EPFL-Verzeichnis zu suchen.",
    nobody: "Niemand gefunden, weder auf dispo noch im EPFL-Verzeichnis.",
  },
  invite: {
    message: (firstName, url) =>
      `Hallo ${firstName}! Ich nutze dispo, um zu sehen, wann Freunde zwischen den Vorlesungen frei sind. Melde dich über meinen Link an, dann sind wir direkt verbunden: ${url}`,
    subject: "Komm zu dispo",
    copied: "Nachricht kopiert",
  },
  connect: {
    connect: "Hinzufügen",
    requested: "Angefragt",
    cancelQuestion: "Anfrage zurückziehen?",
    cancelConfirm: "Zurückziehen",
    accept: "Annehmen",
    decline: "Ablehnen",
    connected: "Hinzugefügt ✓",
    removeQuestion: "Kontakt entfernen?",
    removeConfirm: "Entfernen",
  },
  star: {
    unpin: (name) => `${name} nicht mehr anheften`,
    pin: (name) => `${name} oben anheften`,
    pinnedTitle: "Oben angeheftet",
    pinTitle: "Oben anheften",
  },
  opensInNewTab: "(öffnet in neuem Tab)",
};

export default people;
