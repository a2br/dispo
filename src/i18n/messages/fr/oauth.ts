import type { Messages } from "../en";

const oauth: Messages["oauth"] = {
  title: "Connecter un assistant",
  headline: (app) => `Autoriser ${app} à utiliser ton dispo`,
  intro: "Il verra ce que tu vois dans l’app, en ton nom :",
  sees: [
    "ta semaine : cours, salles, et le temps que tu as bloqué ou libéré",
    "qui est libre parmi les personnes dont tu peux voir l’horaire",
    "quand toi et d’autres êtes tous libres",
  ],
  readOnly: "Lecture seule : il ne peut rien modifier, ni envoyer de demandes, ni écrire à personne.",
  backTo: (host) => `Tu reviendras ensuite sur ${host}.`,
  signedInAs: (email) => `Compte : ${email}`,
  signInFirst: "Connecte-toi avec ton compte EPFL pour continuer.",
  allow: "Autoriser",
  cancel: "Annuler",
  expired: { title: "Ce lien a expiré", text: "Recommence la connexion depuis ton assistant." },
};

export default oauth;
