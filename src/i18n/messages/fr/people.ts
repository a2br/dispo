import type { Messages } from "../en";

const people: Messages["people"] = {
  search: {
    placeholder: "Cherche n’importe qui à l’EPFL par son nom",
    searching: "Recherche…",
    notOnDispo: "Pas encore sur dispo",
    profile: "profil",
    typeMore: "Personne sur dispo ne correspond. Tape encore un peu pour chercher dans l’annuaire EPFL.",
    nobody: "Aucun résultat sur dispo ni dans l’annuaire EPFL.",
  },
  invite: {
    message: (firstName, url) =>
      `Salut ${firstName} ! J’utilise dispo pour voir quand mes amis sont libres entre les cours. Inscris-toi avec mon lien et on est directement en contact : ${url}`,
    subject: "Rejoins-moi sur dispo",
    copied: "Message copié",
  },
  connect: {
    connect: "Ajouter",
    requested: "Demandé",
    cancelQuestion: "Annuler la demande ?",
    cancelConfirm: "Oui, annuler",
    accept: "Accepter",
    decline: "Refuser",
    connected: "Ajouté ✓",
    removeQuestion: "Retirer de tes contacts ?",
    removeConfirm: "Retirer",
  },
  star: {
    unpin: (name) => `Désépingler ${name}`,
    pin: (name) => `Épingler ${name} en haut`,
    pinnedTitle: "Épinglé en haut",
    pinTitle: "Épingler en haut",
  },
  opensInNewTab: "(s’ouvre dans un nouvel onglet)",
};

export default people;
