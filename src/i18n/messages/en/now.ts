const now = {
  title: "Who’s free?",
  /** The dismissible invite card at the top, and the small one it leaves behind. */
  inviteCard: {
    title: "Invite friends",
    hide: "Hide invite card",
    hideShort: "Hide",
    small: "Your invite link connects whoever signs up with you.",
  },
  searchPlaceholder: "Find anyone at EPFL",
  onboarding: {
    title: "Get dispo going",
    intro: "Two steps and your friends’ free time shows up here.",
    scheduleTitle: "Add your schedule",
    scheduleDetail: "Copy your calendar link from IS-Academia and paste it once; it stays in sync.",
    scheduleButton: "Add schedule",
    peopleTitle: "Bring your people",
    peopleDetail: "Find people above, or send your link. Whoever signs up through it is connected with you automatically.",
  },
  wantsToConnect: (n: number): string => (n === 1 ? "Wants to connect" : "Want to connect"),
  accept: "Accept",
  decline: "Decline",
  yourPeople: "Your people",
  freeNow: (n: number) => `${n} free now`,
  groups: "Groups",
  createGroup: "Create group",
  groupsEmpty: "A group is like a group chat for finding a time: everyone in it sees when you’re all free, and it comes with a link for your chat.",
  classmates: "Classmates",
  discover: "Discover",
  classmatesEmpty: "Nobody who shares your courses has joined yet.",
  /** Tooltip on "2/5" next to a classmate. */
  sharedCourses: (shared: number, total: number) => `${shared} of your ${total} ${total === 1 ? "course" : "courses"}`,
  seeAllClassmates: (n: number) => `See all ${n} in Discover`,
  requested: "Requested",
  pending: "pending",
  /** Group cards: the next time everyone in the group is free. Ranges look like "14:00–15:00". */
  groupCard: {
    noSlot: "No common slot in the next 2 weeks",
    freeNow: (until: string) => `Everyone free now, until ${until}`,
    freeToday: (range: string) => `All free today ${range}`,
    freeTomorrow: (range: string) => `All free tomorrow ${range}`,
    /** `day` is a short weekday: "Mon". */
    freeOn: (day: string, range: string) => `All free ${day} ${range}`,
    empty: "Nobody has joined yet",
    locked: "Add your schedule to compare",
  },
  /** Pending group invitation, shown over Now. */
  groupInvite: {
    title: (inviter: string, group: string) => `${inviter} invited you to “${group}”`,
    /** First names shown, and how many more are in the group. */
    members: (names: string[], more: number) =>
      `${names.join(", ")}${more > 0 ? ` and ${more} more` : ""} ${names.length + more === 1 ? "is" : "are"} in it.`,
    note: "If you join, the group can see when you’re free (free/busy only).",
    decline: "Decline",
    accept: "Accept",
    more: (n: number) => `${n} more ${n === 1 ? "invitation" : "invitations"} after this one`,
  },
  /** Signed-out landing page. */
  landing: {
    tagline: "Who’s free right now? See your friends’ EPFL timetables the way you’d peek at a coworker’s calendar.",
    steps: [
      "Sign in with your EPFL Google account.",
      "Copy your calendar link from IS-Academia and paste it, once.",
      "Invite friends or a group chat and see when everyone’s free.",
    ],
    /** `count` is `n` already formatted for the locale ("1’234"). */
    members: (count: string, n: number) => `${count} ${n === 1 ? "person" : "people"} at EPFL ${n === 1 ? "is" : "are"} on dispo.`,
  },
};

export default now;
