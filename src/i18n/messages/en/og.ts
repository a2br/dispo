/**
 * Link-preview images (and their alt text). Rendered for chat apps' crawlers, so they speak the
 * language of whoever shared the link, not of the visitor. Titles are 60px on a 520px column: keep them short.
 */
const og = {
  footer: "EPFL timetables, side by side",
  /** The empty seat next to the inviter. */
  you: "You",
  free: "Free",
  busy: "Busy",
  /** Rounded hours in the owner's locale, e.g. "7.5". */
  hours: (n: string) => `${n} h`,
  freeSummary: (hours: string, from: string, to: string) => `${hours} free between ${from} and ${to}, Monday to Friday.`,
  freeBusy: "Free / busy",
  /** A public schedule link that no longer works. */
  someone: {
    title: "Someone’s week",
    subtitle: "See when they’re free. Open it, no sign-up needed.",
  },
  invite: {
    alt: "An invitation to dispo",
    eyebrow: "You’re invited",
    title: "See when you’re both free",
    titleFrom: (first: string) => `${first} wants to see when you’re both free`,
    subtitle: "EPFL timetables side by side. Sign in once with your EPFL account.",
  },
  group: {
    alt: "Join a group on dispo",
    deadTitle: "Find a time together",
    deadSubtitle: "See when everyone in your group is free.",
    soFar: (n: number) => `${n} ${n === 1 ? "person" : "people"} so far`,
    join: (name: string) => `Join “${name}”`,
    subtitle: "See when everyone’s free between classes. One tap, EPFL sign-in.",
  },
  home: {
    alt: "dispo: see when your EPFL friends are free",
    title: "Who’s free right now?",
    subtitle: "See your friends’ EPFL timetables side by side and find a time in one look.",
  },
};

export default og;
