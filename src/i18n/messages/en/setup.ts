const setup = {
  title: "Add your schedule",
  lede: "One paste. It stays in sync with IS-Academia on its own.",
  /** Three steps; the link and the bold button name sit between the parts. */
  step1: { before: "Open ", link: "your IS-Academia schedule", after: "", note: "(sign in with your EPFL account if asked)" },
  /** `button` is IS-Academia's own label for the link. */
  step2: { before: "In the pop-up, tap ", button: "Copy ICS link", after: "", note: "(the small link under the red button)" },
  step3: "Come back and tap the button below",
  fineprint: "The link contains a private key: it’s stored encrypted and only used to refresh your timetable. Remove it anytime in Me.",
  /** The paste-a-link form, here and in Me. */
  form: {
    paste: "Paste link & connect",
    fetching: "Fetching your schedule…",
    placeholder: "…or paste it here",
    placeholderReplace: "New calendar link",
    connect: "Connect",
    replace: "Replace",
    clipboardNoLink: "Your clipboard doesn’t hold a link. Copy it from IS-Academia first, or paste it below.",
    clipboardFailed: "Couldn’t read the clipboard. Paste the link below instead.",
    failed: "Couldn't fetch that calendar. Check the link and try again.",
    loaded: (n: number) => `Loaded ${n} ${n === 1 ? "session" : "sessions"}.`,
  },
  /** Calendar link problems, by `IcsError` code. Also shown in Me after a failed background refresh. */
  errors: {
    emptyInput: "Paste the calendar link first.",
    notALink: "That doesn't look like a link.",
    notHttps: "Only https links are accepted.",
    host: "Only links from campus.epfl.ch / epfl.ch are accepted.",
    port: "Unexpected port in link.",
    redirect: "The link redirected somewhere else; paste the direct calendar link.",
    http: (status: number) => `Calendar server answered ${status}.`,
    tooLarge: "Calendar file is too large.",
    notCalendar: "That link didn't return a calendar.",
    empty: "The calendar is empty. Is the semester schedule published yet?",
    failed: "Couldn't fetch the calendar.",
  },
};

export default setup;
