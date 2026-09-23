const me = {
  rightNow: "Right now",
  myWeek: "My week",
  /** Who can see my schedule: one radio per `users.visibility`. */
  visibility: {
    title: "Who can see my schedule",
    everyone: { title: "Everyone at EPFL (default)", desc: "Anyone signed in sees your timetable, like a shared work calendar." },
    connections: { title: "Connections see details", desc: "Everyone sees free/busy; only people you accept see courses and rooms." },
    private: {
      title: "Connections only",
      desc: "Only people you’ve accepted see your schedule. You can still be found by name, so people can send you a request.",
    },
  },
  inviteTitle: "Invite link",
  /** View-only link to my week (/s/<code>). */
  publicLink: {
    title: "Public link",
    blurb: "A view-only link to your week that anyone can open without signing up: free/busy only, no course names or rooms.",
    /** Goes before the link in a chat message. */
    textThisWeek: "When I’m free this week:",
    textNextWeek: "When I’m free next week:",
    share: "Share link",
    preview: "Preview ↗",
    reset: "Reset link",
    resetHint: "Make a new link; the old one stops working",
    turnOff: "Turn off",
    create: "Create public link",
  },
  discover: {
    title: "Discover",
    toggle: "Show me in Discover",
    toggleHint:
      "People who share your courses can find you there, and you can find them. Turned off, you disappear from Discover and it’s hidden for you. Name search follows your visibility above.",
  },
  phone: {
    label: "Phone number",
    optional: "(optional)",
    hint: "Shown to classmates in Discover and to your connections, so they can text you. Leave empty to hide it.",
    invalid: "That doesn’t look like a phone number.",
    saved: "Saved",
    removed: "Removed",
  },
  calendar: {
    title: "Calendar link",
    sessions: "Sessions loaded",
    lastSynced: "Last synced",
    lastError: (error: string) => `Last refresh failed: ${error}`,
    refresh: "Refresh now",
    viewWeek: "View my week",
    replace: "Replace the link",
    remove: "Remove my schedule",
    none: "No calendar yet.",
  },
  signOut: "Sign out",
  openSource: "dispo is open source.",
  viewCode: "View the code on GitHub ↗",
};

export default me;
