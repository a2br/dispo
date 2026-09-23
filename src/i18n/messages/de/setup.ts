import type { Messages } from "../en";

const setup: Messages["setup"] = {
  title: "Stundenplan hinzufügen",
  lede: "Einmal einfügen. Danach bleibt er von selbst mit IS-Academia synchron.",
  step1: { before: "Öffne ", link: "deinen IS-Academia-Stundenplan", after: "", note: "(melde dich mit deinem EPFL-Konto an, falls nötig)" },
  step2: { before: "Tippe im Pop-up auf ", button: "Copy ICS link", after: "", note: "(der kleine Link unter dem roten Button)" },
  step3: "Komm zurück und tippe auf den Button unten",
  fineprint: "Der Link enthält einen privaten Schlüssel: Er wird verschlüsselt gespeichert und nur verwendet, um deinen Stundenplan zu aktualisieren. Du kannst ihn jederzeit unter Ich entfernen.",
  form: {
    paste: "Link einfügen & verbinden",
    fetching: "Stundenplan wird geladen…",
    placeholder: "…oder hier einfügen",
    placeholderReplace: "Neuer Kalenderlink",
    connect: "Verbinden",
    replace: "Ersetzen",
    clipboardNoLink: "In deiner Zwischenablage ist kein Link. Kopiere ihn zuerst in IS-Academia oder füge ihn unten ein.",
    clipboardFailed: "Die Zwischenablage konnte nicht gelesen werden. Füge den Link stattdessen unten ein.",
    failed: "Dieser Kalender konnte nicht geladen werden. Prüfe den Link und versuch es nochmals.",
    loaded: (n) => `${n} ${n === 1 ? "Lektion" : "Lektionen"} geladen.`,
  },
  errors: {
    emptyInput: "Füge zuerst den Kalenderlink ein.",
    notALink: "Das sieht nicht nach einem Link aus.",
    notHttps: "Nur https-Links werden akzeptiert.",
    host: "Nur Links von campus.epfl.ch / epfl.ch werden akzeptiert.",
    port: "Unerwarteter Port im Link.",
    redirect: "Der Link leitet woanders hin weiter; füge den direkten Kalenderlink ein.",
    http: (status) => `Der Kalenderserver hat mit ${status} geantwortet.`,
    tooLarge: "Die Kalenderdatei ist zu gross.",
    notCalendar: "Dieser Link hat keinen Kalender geliefert.",
    empty: "Der Kalender ist leer. Ist der Semesterstundenplan schon veröffentlicht?",
    failed: "Der Kalender konnte nicht geladen werden.",
  },
};

export default setup;
