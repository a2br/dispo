import type { Messages } from "../en";

const now: Messages["now"] = {
  title: "Qui est dispo\u202f?",
  inviteCard: {
    title: "Invite tes amis",
    hide: "Masquer la carte d’invitation",
    hideShort: "Masquer",
    small: "Qui s’inscrit avec ton lien d’invitation est ajouté à tes contacts.",
  },
  searchPlaceholder: "Cherche n’importe qui à l’EPFL",
  onboarding: {
    title: "Lance dispo",
    intro: "Deux étapes, et les moments libres de tes amis s’affichent ici.",
    scheduleTitle: "Ajoute ton horaire",
    scheduleDetail: "Copie le lien de ton agenda depuis IS-Academia et colle-le une fois ; il reste synchronisé.",
    scheduleButton: "Ajouter l’horaire",
    peopleTitle: "Fais venir tes amis",
    peopleDetail: "Cherche des gens ci-dessus ou envoie ton lien. Qui s’inscrit avec est automatiquement ajouté à tes contacts.",
  },
  wantsToConnect: (n) => (n > 1 ? "Veulent t’ajouter" : "Veut t’ajouter"),
  accept: "Accepter",
  decline: "Refuser",
  yourPeople: "Tes contacts",
  freeNow: (n) => `${n} ${n > 1 ? "libres" : "libre"} maintenant`,
  groups: "Groupes",
  createGroup: "Créer un groupe",
  groupsEmpty: "Un groupe, c’est comme un groupe de discussion pour trouver un moment : chaque membre voit quand vous êtes tous libres, et il y a un lien à partager dans votre discussion.",
  classmates: "Camarades de cours",
  discover: "Découvrir",
  classmatesEmpty: "Personne qui suit tes cours ne s’est encore inscrit.",
  sharedCourses: (shared, total) => `${shared} de tes ${total} cours`,
  seeAllClassmates: (n) => `Voir les ${n} dans Découvrir`,
  requested: "Demandes envoyées",
  pending: "en attente",
  groupCard: {
    noSlot: "Aucun créneau commun dans les 2 prochaines semaines",
    freeNow: (until) => `Tout le monde est libre maintenant, jusqu’à ${until}`,
    freeToday: (range) => `Tout le monde libre aujourd’hui, ${range}`,
    freeTomorrow: (range) => `Tout le monde libre demain, ${range}`,
    freeOn: (day, range) => `Tout le monde libre ${day}, ${range}`,
    empty: "Personne n’a encore rejoint",
    locked: "Ajoute ton horaire pour comparer",
  },
  groupInvite: {
    title: (inviter, group) => `${inviter} t’invite dans « ${group} »`,
    members: (names, more) =>
      `${names.join(", ")}${more > 0 ? ` et ${more} ${more > 1 ? "autres" : "autre"}` : ""} ${names.length + more > 1 ? "en font" : "en fait"} partie.`,
    note: "Si tu rejoins, le groupe voit quand tu es libre (libre/occupé seulement).",
    decline: "Refuser",
    accept: "Accepter",
    more: (n) => `Encore ${n} ${n > 1 ? "invitations" : "invitation"} après celle-ci`,
  },
  landing: {
    tagline: "Qui est dispo en ce moment ? Vois les horaires EPFL de tes amis, comme tu jetterais un œil à l’agenda d’un collègue.",
    steps: [
      "Connecte-toi avec ton compte Google EPFL.",
      "Copie le lien de ton agenda depuis IS-Academia et colle-le, une seule fois.",
      "Invite des amis ou un groupe de discussion et vois quand tout le monde est libre.",
    ],
    members: (count, n) => `${count} ${n > 1 ? "personnes de l’EPFL sont" : "personne de l’EPFL est"} sur dispo.`,
  },
};

export default now;
