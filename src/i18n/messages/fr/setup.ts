import type { Messages } from "../en";

const setup: Messages["setup"] = {
  title: "Ajoute ton horaire",
  lede: "Un seul copier-coller. Il reste synchronisé avec IS-Academia tout seul.",
  step1: { before: "Ouvre ", link: "ton horaire IS-Academia", after: "", note: "(connecte-toi avec ton compte EPFL si on te le demande)" },
  step2: { before: "Dans la fenêtre, touche ", button: "Copy ICS link", after: "", note: "(le petit lien sous le bouton rouge)" },
  step3: "Reviens ici et touche le bouton ci-dessous",
  fineprint: "Le lien contient une clé privée : il est stocké chiffré et sert uniquement à mettre ton horaire à jour. Tu peux le supprimer à tout moment dans Moi.",
  form: {
    paste: "Coller le lien et ajouter",
    fetching: "Chargement de ton horaire…",
    placeholder: "…ou colle-le ici",
    placeholderReplace: "Nouveau lien de l’agenda",
    connect: "Ajouter",
    replace: "Remplacer",
    clipboardNoLink: "Ton presse-papiers ne contient pas de lien. Copie-le d’abord depuis IS-Academia, ou colle-le ci-dessous.",
    clipboardFailed: "Impossible de lire le presse-papiers. Colle plutôt le lien ci-dessous.",
    failed: "Impossible de récupérer cet agenda. Vérifie le lien et réessaie.",
    loaded: (n) => `${n} ${n <= 1 ? "séance chargée" : "séances chargées"}.`,
  },
  errors: {
    emptyInput: "Colle d’abord le lien de l’agenda.",
    notALink: "Ça ne ressemble pas à un lien.",
    notHttps: "Seuls les liens https sont acceptés.",
    host: "Seuls les liens de campus.epfl.ch / epfl.ch sont acceptés.",
    port: "Port inattendu dans le lien.",
    redirect: "Le lien redirige ailleurs ; colle le lien direct de l’agenda.",
    http: (status) => `Le serveur de l’agenda a répondu ${status}.`,
    tooLarge: "Le fichier de l’agenda est trop volumineux.",
    notCalendar: "Ce lien n’a pas renvoyé d’agenda.",
    empty: "L’agenda est vide. L’horaire du semestre est-il déjà publié ?",
    failed: "Impossible de récupérer l’agenda.",
  },
};

export default setup;
