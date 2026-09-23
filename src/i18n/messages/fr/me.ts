import type { Messages } from "../en";

const me: Messages["me"] = {
  rightNow: "En ce moment",
  myWeek: "Ma semaine",
  visibility: {
    title: "Qui peut voir mon horaire",
    everyone: { title: "Tout le monde à l’EPFL (par défaut)", desc: "Toute personne connectée voit ton horaire, comme un agenda partagé au travail." },
    connections: { title: "Détails pour mes contacts", desc: "Tout le monde voit libre/occupé ; seules les personnes que tu acceptes voient les cours et les salles." },
    private: {
      title: "Mes contacts uniquement",
      desc: "Seules les personnes que tu as acceptées voient ton horaire. On peut quand même te trouver par ton nom pour t’envoyer une demande.",
    },
  },
  inviteTitle: "Lien d’invitation",
  publicLink: {
    title: "Lien public",
    blurb: "Un lien vers ta semaine, en lecture seule, que tout le monde peut ouvrir sans s’inscrire : libre/occupé uniquement, sans noms de cours ni salles.",
    textThisWeek: "Quand je suis libre cette semaine :",
    textNextWeek: "Quand je suis libre la semaine prochaine :",
    share: "Partager le lien",
    preview: "Aperçu ↗",
    reset: "Nouveau lien",
    resetHint: "Crée un nouveau lien ; l’ancien ne marche plus",
    turnOff: "Désactiver",
    create: "Créer un lien public",
  },
  discover: {
    title: "Découvrir",
    toggle: "Me montrer dans Découvrir",
    toggleHint:
      "Les personnes qui ont des cours en commun avec toi peuvent t’y trouver, et toi aussi. Désactivé, tu disparais de Découvrir et la page est masquée pour toi. La recherche par nom suit ta visibilité ci-dessus.",
  },
  phone: {
    label: "Numéro de téléphone",
    optional: "(facultatif)",
    hint: "Visible pour tes camarades de cours dans Découvrir et pour tes contacts, pour qu’on puisse t’écrire. Laisse vide pour le masquer.",
    invalid: "Ça ne ressemble pas à un numéro de téléphone.",
    saved: "Enregistré",
    removed: "Supprimé",
  },
  calendar: {
    title: "Lien de l’agenda",
    sessions: "Séances chargées",
    lastSynced: "Dernière synchro",
    lastError: (error) => `La dernière mise à jour a échoué : ${error}`,
    refresh: "Actualiser",
    viewWeek: "Voir ma semaine",
    replace: "Remplacer le lien",
    remove: "Supprimer mon horaire",
    none: "Pas encore d’agenda.",
  },
  signOut: "Se déconnecter",
  openSource: "dispo est open source.",
  viewCode: "Voir le code sur GitHub ↗",
};

export default me;
