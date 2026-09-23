import type { Messages } from "../en";

/** "de Marc", "d’Anatole": elide before a vowel. */
const de = (name: string) => (/^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(name) ? `d’${name}` : `de ${name}`);

const share: Messages["share"] = {
  weekOf: (first) => `La semaine ${de(first)}`,
  noSchedule: (first) => `${first} n’a pas encore ajouté son horaire.`,
  findTime: (first) => `Trouver un moment avec ${first}`,

  person: {
    title: "Personne",
    addToSee: "Ajoute ton horaire pour voir",
    worksBothWays: "Ça marche dans les deux sens\u202F: ajoute ton horaire pour voir celui des personnes qui ne sont pas encore dans tes contacts. Entre contacts, on voit toujours l’horaire de l’autre.",
    onlyAccepted: (first) => `Seules les personnes acceptées par ${first} voient son horaire. Envoie une demande de contact.`,
    addMine: "Ajouter mon horaire",
    compare: "Comparer",
    noCommon: "Aucun cours en commun avec toi.",
    sharesCourses: (shared, mine) => (mine === 1 ? "Suit ton cours" : `Suit ${shared} de tes ${mine} cours`),
    synced: (age) => `Synchronisé ${age}`,
    refreshFailed: "dernière mise à jour échouée",
  },

  schedule: {
    title: "Horaire",
    imageAlt: (first) => `La semaine ${de(first)} sur dispo`,
    description: (first, week) => `Les moments libres et occupés ${de(first)}, ${week}. Regarde quand vous êtes libres tous les deux sur dispo.`,
    compareMine: "Comparer avec le mien",
    bothFree: "Voir quand on est libres",
    signInBlurb: (first) =>
      `Connecte-toi avec ton compte EPFL et ajoute ton horaire une fois. Tu seras dans les contacts ${de(first)} et tu verras vos deux semaines côte à côte.`,
  },

  invite: {
    title: "Invitation",
    invitedYou: (first) => `${first} t’invite sur dispo`,
    description: (first) => `Regarde quand ${first} et toi êtes libres entre les cours. Connecte-toi avec ton compte EPFL.`,
    yourLink: "C’est ton lien d’invitation",
    yourLinkBlurb: "Toute personne de l’EPFL qui l’ouvre et se connecte est directement ajoutée à tes contacts\u202F: vous verrez vos moments libres respectifs.",
    backHome: "Retour à dispo",
    from: "Invitation de",
    headline: (first) => `Regarde quand ${first} et toi êtes libres.`,
    pitch: "dispo affiche vos horaires EPFL côte à côte\u202F: trouver un créneau pour manger ou pour une réunion de projet, ça se fait en un coup d’œil.",
    connect: (first) => `Ajouter ${first}`,
  },
};

export default share;
