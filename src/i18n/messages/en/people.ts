const people = {
  /** Person search (Now). */
  search: {
    placeholder: "Search anyone at EPFL by name",
    searching: "Searching…",
    notOnDispo: "Not on dispo yet",
    profile: "profile",
    typeMore: "Nobody on dispo matches. Type a bit more to search the EPFL directory.",
    nobody: "Nobody found on dispo or in the EPFL directory.",
  },
  /** Invite someone found in the EPFL directory. Written in the sender's language; always one line, link last. */
  invite: {
    message: (firstName: string, url: string) =>
      `Hey ${firstName}! I'm using dispo to see when friends are free between classes. Join through my link and we're connected straight away: ${url}`,
    subject: "Join me on dispo",
    copied: "Message copied",
  },
  /** Connect button on profiles and Discover. */
  connect: {
    connect: "Connect",
    requested: "Requested",
    cancelQuestion: "Cancel request?",
    cancelConfirm: "Cancel it",
    accept: "Accept",
    decline: "Decline",
    connected: "Connected ✓",
    removeQuestion: "Remove connection?",
    removeConfirm: "Remove",
  },
  /** Star button: pins a person or group to the top of lists. */
  star: {
    unpin: (name: string) => `Unpin ${name}`,
    pin: (name: string) => `Pin ${name} to the top`,
    pinnedTitle: "Pinned to the top",
    pinTitle: "Pin to the top",
  },
  /** Screen-reader note on links that leave dispo. */
  opensInNewTab: "(opens in a new tab)",
};

export default people;
