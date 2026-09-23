const pages = {
  /** Back button on subscreens: "Back to Now". */
  backTo: (label: string) => `Back to ${label}`,
  /** The share/copy button's own states. */
  share: { label: "Share link", copied: "Link copied", retry: "Try again", prompt: "Copy this link" },
  notFound: {
    title: "Nothing here",
    text: "This page doesn’t exist, or it isn’t visible to you.",
    home: "Back home",
  },
  privacy: {
    title: "Privacy",
    updated: (date: string) => `Last updated ${date}`,
    intro:
      "dispo is a small student project that shows EPFL friends when each other are free. It is not affiliated with EPFL. This page says what it stores and why.",
    stores: {
      title: "What dispo stores",
      google: "From Google sign-in: your name and @epfl.ch email address. Nothing else from your Google account, not even your profile picture.",
      link: "The calendar link you paste from IS-Academia, encrypted (AES-256-GCM). It is never shown to anyone, including you after you save it.",
      classes: "The classes in that calendar (course, time, room, teacher), refreshed a few times a day.",
      app: "What you set up in the app: connections, groups, pinned people, visibility settings, your language and, if you add one, your phone number.",
    },
    /** `profile` is a link to Me, between `before` and `after`. */
    who: {
      title: "Who sees it",
      before: "Other signed-in users see your schedule according to your setting on ",
      profile: "your profile",
      after:
        ": everyone at EPFL (the default), free/busy for everyone with details only for your connections, or connections only. A public link, if you create one, shows free/busy only, without course names or rooms. Your data is not sold, shared with third parties or used for ads.",
    },
    where: {
      title: "Where it lives",
      text: "The app runs on Vercel and the database on Turso, both in the EU (Ireland). A session cookie keeps you signed in and a language cookie remembers your language; there are no analytics or tracking cookies.",
    },
    /** The contact email goes between `before` and `after`. */
    delete: {
      title: "Deleting your data",
      before: "Email ",
      after: " from your EPFL address and your account and everything linked to it will be deleted.",
    },
  },
};

export default pages;
