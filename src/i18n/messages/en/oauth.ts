/** /oauth/consent: letting an AI assistant (Claude) read dispo as you, through the MCP connector. */
const oauth = {
  title: "Connect an assistant",
  /** `app` is the name the client registered with, e.g. "Claude". */
  headline: (app: string) => `Let ${app} use your dispo`,
  intro: "It will see what you see in the app, as you:",
  sees: [
    "your week: classes, rooms, and the time you’ve blocked or freed",
    "who’s free among the people whose schedules you can see",
    "when you and others are all free",
  ],
  readOnly: "Read-only: it can’t change anything, send requests or message anyone.",
  backTo: (host: string) => `You’ll go back to ${host}.`,
  signedInAs: (email: string) => `Signed in as ${email}`,
  signInFirst: "Sign in with your EPFL account to continue.",
  allow: "Allow",
  cancel: "Cancel",
  expired: { title: "This link expired", text: "Start connecting again from your assistant." },
};

export default oauth;
