/** A person's page (/u), the public view-only week (/s) and the personal invite (/i). */
const share = {
  /** "Anatole’s week": the public page's heading, and the share preview's title. */
  weekOf: (first: string) => `${first}’s week`,
  noSchedule: (first: string) => `${first} hasn’t added a schedule yet.`,
  findTime: (first: string) => `Find a time with ${first}`,

  /** /u/[id] */
  person: {
    title: "Person",
    addToSee: "Add your schedule to see",
    worksBothWays: "Schedules work both ways: add yours to see people you’re not connected with yet. Your connections can always see each other.",
    onlyAccepted: (first: string) => `Only people ${first} has accepted can see their schedule. Send a request to connect.`,
    addMine: "Add my schedule",
    compare: "Compare",
    noCommon: "No courses in common with you.",
    sharesCourses: (shared: number, mine: number) => `Shares ${shared} of your ${mine} course${mine === 1 ? "" : "s"}`,
    synced: (age: string) => `Synced ${age}`,
    refreshFailed: "last refresh failed",
  },

  /** /s/[code]: public, view-only week. */
  schedule: {
    title: "Schedule",
    imageAlt: (first: string) => `${first}’s week on dispo`,
    description: (first: string, week: string) => `When ${first} is free and busy, ${week}. See when you’re both free on dispo.`,
    compareMine: "Compare with mine",
    bothFree: "See when we’re both free",
    signInBlurb: (first: string) =>
      `Sign in with your EPFL account and add your timetable once. You’ll be connected with ${first} and see both weeks side by side.`,
  },

  /** /i/[code]: personal invite link. */
  invite: {
    title: "Invite",
    invitedYou: (first: string) => `${first} invited you to dispo`,
    description: (first: string) => `See when you and ${first} are both free between classes. Sign in with your EPFL account.`,
    yourLink: "This is your invite link",
    yourLinkBlurb: "Anyone at EPFL who opens it and signs in is connected with you right away, so you’ll see each other’s free time.",
    backHome: "Back to dispo",
    from: "Invitation from",
    headline: (first: string) => `See when you and ${first} are both free.`,
    pitch: "dispo shows your EPFL timetables side by side, so finding a gap for lunch or a project meeting takes one look.",
    connect: (first: string) => `Connect with ${first}`,
  },
};

export default share;
