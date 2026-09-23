import type { Messages } from "../en";

const discover: Messages["discover"] = {
  title: "Entdecken",
  lede: "Personen, die Kurse mit dir teilen und noch nicht in deinen Kontakten sind. Es werden nur eure gemeinsamen Kurse angezeigt.",
  off: "Du hast Entdecken ausgeschaltet: Andere sehen dich hier nicht, und du siehst sie nicht.",
  turnOn: "Unter Ich wieder einschalten",
  noSchedule: "Füge zuerst deinen Stundenplan hinzu, um Personen mit denselben Kursen zu finden.",
  addSchedule: "Stundenplan hinzufügen",
  people: "Personen",
  nobody: "Noch niemand Neues teilt deine Kurse. Lade deinen Studiengang über die Suche auf Jetzt ein.",
  shared: (n, total) => `${n}/${total} Kurse`,
  byCourse: "Nach Kurs",
  courseCount: (n) => (n === 0 ? "niemand Neues" : n === 1 ? "1 Person" : `${n} Personen`),
  course: {
    nobody: "Noch niemand Neues hier.",
    strangers: (n) => `${n} ${n === 1 ? "Person, die du noch nicht kennst" : "Personen, die du noch nicht kennst"}`,
    friends: (n) => `${n} deiner Kontakte ${n === 1 ? "besucht" : "besuchen"} diesen Kurs auch`,
  },
};

export default discover;
