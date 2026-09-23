const auth = {
  /** Shown on the landing page after a failed sign-in (`/?error=<code>`). */
  errors: {
    cancelled: "Sign-in cancelled.",
    expired: "Sign-in took too long. Try again.",
    failed: "Sign-in failed. Try again.",
    epfl: "Please sign in with your @epfl.ch Google account.",
  },
  continueWithGoogle: "Continue with EPFL Google",
  googleMissing: "Google sign-in isn’t configured on this server yet (set GOOGLE_CLIENT_ID / SECRET).",
  /** Under the sign-in button, followed by a link to the privacy page. */
  fineprint: "Only @epfl.ch accounts. Your calendar link is stored encrypted and never shown to anyone.",
};

export default auth;
