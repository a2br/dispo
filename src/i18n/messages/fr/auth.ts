import type { Messages } from "../en";

const auth: Messages["auth"] = {
  errors: {
    cancelled: "Connexion annulée.",
    expired: "La connexion a pris trop de temps. Réessaie.",
    failed: "La connexion a échoué. Réessaie.",
    epfl: "Connecte-toi avec ton compte Google @epfl.ch.",
  },
  continueWithGoogle: "Continuer avec Google EPFL",
  googleMissing: "La connexion Google n’est pas encore configurée sur ce serveur (définis GOOGLE_CLIENT_ID / SECRET).",
  fineprint: "Uniquement les comptes @epfl.ch. Le lien de ton agenda est stocké chiffré et n’est jamais montré à personne.",
};

export default auth;
