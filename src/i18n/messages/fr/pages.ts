import type { Messages } from "../en";

const pages: Messages["pages"] = {
  backTo: (label) => `Retour à ${label}`,
  share: { label: "Partager le lien", copied: "Lien copié", retry: "Réessayer", prompt: "Copie ce lien" },
  notFound: {
    title: "Rien ici",
    text: "Cette page n’existe pas, ou tu n’y as pas accès.",
    home: "Retour à l’accueil",
  },
  privacy: {
    title: "Confidentialité",
    updated: (date) => `Dernière mise à jour : ${date}`,
    intro:
      "dispo est un petit projet étudiant qui montre à des amis de l’EPFL quand les autres sont libres. Il n’est pas affilié à l’EPFL. Cette page explique ce qu’il stocke et pourquoi.",
    stores: {
      title: "Ce que dispo stocke",
      google: "De la connexion Google : ton nom et ton adresse e-mail @epfl.ch. Rien d’autre de ton compte Google, pas même ta photo de profil.",
      link: "Le lien de l’agenda que tu colles depuis IS-Academia, chiffré (AES-256-GCM). Il n’est jamais montré à personne, pas même à toi une fois enregistré.",
      classes: "Les séances de cet agenda (cours, heure, salle, enseignant), actualisées plusieurs fois par jour.",
      app: "Ce que tu configures dans l’app : contacts, groupes, personnes épinglées, réglages de visibilité, ta langue et, si tu en ajoutes un, ton numéro de téléphone.",
    },
    who: {
      title: "Qui le voit",
      before: "Les autres personnes connectées voient ton horaire selon ton réglage sur ",
      profile: "ton profil",
      after:
        " : tout le monde à l’EPFL (par défaut), libre/occupé pour tout le monde avec les détails seulement pour tes contacts, ou tes contacts uniquement. Un lien public, si tu en crées un, n’affiche que libre/occupé, sans noms de cours ni salles. Tes données ne sont ni vendues, ni partagées avec des tiers, ni utilisées pour de la publicité.",
    },
    where: {
      title: "Où sont les données",
      text: "L’app tourne sur Vercel et la base de données sur Turso, toutes deux dans l’UE (Irlande). Un cookie de session garde ta connexion ouverte et un cookie de langue retient ta langue ; il n’y a ni statistiques ni cookies de suivi.",
    },
    delete: {
      title: "Supprimer tes données",
      before: "Écris à ",
      after: " depuis ton adresse EPFL, et ton compte ainsi que tout ce qui y est lié seront supprimés.",
    },
  },
};

export default pages;
