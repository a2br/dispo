import type { Messages } from "../en";

const og: Messages["og"] = {
  footer: "Les horaires EPFL, côte à côte",
  you: "Toi",
  free: "Libre",
  busy: "Occupé",
  hours: (n) => `${n} h`,
  freeSummary: (hours, from, to) => `${hours} de libre entre ${from} et ${to}, du lundi au vendredi.`,
  freeBusy: "Libre / occupé",
  someone: {
    title: "La semaine de quelqu’un",
    subtitle: "Regarde quand cette personne est libre. Sans inscription.",
  },
  invite: {
    alt: "Une invitation sur dispo",
    eyebrow: "Une invitation pour toi",
    title: "Regarde quand vous êtes libres",
    titleFrom: (first) => `${first} veut voir quand vous êtes libres`,
    subtitle: "Les horaires EPFL côte à côte. Connecte-toi avec ton compte EPFL.",
  },
  group: {
    alt: "Rejoins un groupe sur dispo",
    deadTitle: "Trouvez un moment ensemble",
    deadSubtitle: "Regarde quand tout ton groupe est libre.",
    soFar: (n) => `Déjà ${n} personne${n > 1 ? "s" : ""}`,
    join: (name) => `Rejoins « ${name} »`,
    subtitle: "Regarde quand tout le monde est libre entre les cours. Un clic, connexion EPFL.",
  },
  home: {
    alt: "dispo : regarde quand tes amis de l’EPFL sont libres",
    title: "Qui est dispo maintenant ?",
    subtitle: "Les horaires EPFL de tes amis côte à côte : un coup d’œil suffit pour trouver un moment.",
  },
};

export default og;
