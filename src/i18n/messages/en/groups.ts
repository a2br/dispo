const groups = {
  /** Saved when a group is created without a name. */
  untitled: "Untitled group",
  fallbackTitle: "Group",
  /** Confirm dialogs: the button that backs out. */
  keep: "Keep",
  create: {
    title: "Create group",
    intro: "Like a group chat: everyone in it sees it and can find a time together. You’ll get a link to invite anyone else.",
    name: "Name",
    namePlaceholder: "e.g. ADA project, Sat climbing",
    addPeople: "Add people",
    optional: "optional",
    hint: "Your connections are added right away. Anyone else gets an invite they can accept or decline.",
    submit: "Create group",
    everyoneSees: "Everyone you add will see this group.",
  },
  page: {
    created: "Group created. Now invite the others.",
    createdHint: "Drop the link in your group chat. Whoever opens it and signs in joins the group and gets connected with everyone in it.",
    shareText: "See when everyone’s free:",
    shareInvite: "Share invite link",
    inviteLink: "Invite link",
    everyoneFree: "Everyone free",
    addScheduleToCompare: "Add your schedule to compare",
    inviteToCompare: "Invite people to compare",
    /** Next slot when everyone is free. `range` is "14:00–15:00". */
    nowUntil: (time: string) => `Now, until ${time}`,
    slotToday: (range: string) => `Today ${range}`,
    slotTomorrow: (range: string) => `Tomorrow ${range}`,
    slotDay: (day: { short: string; long: string }, range: string) => `${day.short} ${range}`,
    noSlot: "No common slot in the next 2 weeks",
    addSchedule: "Add my schedule",
    openCalendar: "Open in calendar",
    count: (n: number) => `${n} in this group`,
    you: "you",
    creator: "created it",
    invited: "Invited · waiting for an answer",
    addPeople: "Add people",
    addHint: "Your connections join right away; anyone else gets an invite to accept.",
    addSubmit: "Add to group",
    settings: "Settings",
    nameLabel: "Group name",
    rename: "Rename",
    leave: "Leave group",
    leaveQuestion: "Leave this group?",
    leaveConfirm: "Leave",
    delete: "Delete group",
    deleteQuestion: "Delete it for everyone?",
    deleteConfirm: "Delete",
  },
  /** Invite link page (/g/<code>), also its link preview. */
  invite: {
    metaTitle: (group: string) => `Join “${group}” on dispo`,
    /** `others` = members besides the creator. */
    metaDescription: (owner: string, others: number) =>
      `${owner} and ${others === 0 ? "you" : `${others} other${others === 1 ? "" : "s"}`}: see when everyone is free between classes. Sign in with your EPFL account.`,
    title: (group: string) => `Join “${group}”`,
    /** Appended to the first few names when there are more. */
    more: (n: number) => `${n} more`,
    /** `names` is already a list ("Ana, Tom and 3 more"); `n` = how many people that is. */
    here: (names: string, n: number) => `${names} ${n === 1 ? "is" : "are"} here.`,
    pitch: "Sign in once and you’ll see when everyone’s free, connected with the whole group.",
    join: "Join the group",
  },
  /** Picking people to add to a group. */
  adder: {
    search: "Search anyone on dispo",
    noMatch: "No match on dispo. Share the group’s link instead.",
    hint: "Search for anyone above.",
    getsInvite: "Gets an invite to accept",
  },
};

export default groups;
