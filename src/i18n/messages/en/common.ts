const common = {
  today: "today",
  tomorrow: "tomorrow",
  now: "now",
  save: "Save",
  saved: "Saved",
  cancel: "Cancel",
  back: "Back",
  pinned: "Pinned",
  epfl: "EPFL",
  /** Personal invite link, offered on Now and in Me. The share text goes before the link in a chat message. */
  invite: {
    text: "See when we’re both free between classes:",
    share: "Share my link",
    short: "Invite",
    blurb: "Whoever signs up through your link is connected with you straight away.",
  },
  ago: {
    never: "never",
    justNow: "just now",
    minutes: (n: number) => `${n}m ago`,
    hours: (n: number) => `${n}h ago`,
    days: (n: number) => `${n}d ago`,
  },
  /** Short duration: "45 min", "2 h", "2 h 30". */
  duration: (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
  },
};

export default common;
