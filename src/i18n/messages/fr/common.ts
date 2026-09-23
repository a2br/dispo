import type { Messages } from "../en";

const common: Messages["common"] = {
  today: "aujourd’hui",
  tomorrow: "demain",
  now: "maintenant",
  save: "Enregistrer",
  saved: "Enregistré",
  cancel: "Annuler",
  back: "Retour",
  pinned: "Épinglé",
  epfl: "EPFL",
  invite: {
    text: "Regarde quand on est libres tous les deux entre les cours :",
    share: "Partager mon lien",
    short: "Inviter",
    blurb: "Qui s’inscrit avec ton lien est directement ajouté à tes contacts.",
  },
  ago: {
    never: "jamais",
    justNow: "à l’instant",
    minutes: (n) => `il y a ${n} min`,
    hours: (n) => `il y a ${n} h`,
    days: (n) => `il y a ${n} j`,
  },
  duration: (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
  },
};

export default common;
