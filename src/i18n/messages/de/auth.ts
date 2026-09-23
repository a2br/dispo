import type { Messages } from "../en";

const auth: Messages["auth"] = {
  errors: {
    cancelled: "Anmeldung abgebrochen.",
    expired: "Die Anmeldung hat zu lange gedauert. Versuch es nochmals.",
    failed: "Die Anmeldung ist fehlgeschlagen. Versuch es nochmals.",
    epfl: "Bitte melde dich mit deinem @epfl.ch-Google-Konto an.",
  },
  continueWithGoogle: "Weiter mit EPFL-Google",
  googleMissing: "Die Google-Anmeldung ist auf diesem Server noch nicht eingerichtet (GOOGLE_CLIENT_ID / SECRET setzen).",
  fineprint: "Nur @epfl.ch-Konten. Dein Kalenderlink wird verschlüsselt gespeichert und nie jemandem angezeigt.",
};

export default auth;
