const discover = {
  title: "Discover",
  lede: "People who share your courses and aren’t in your people yet. Only the courses you have in common are shown.",
  off: "You’ve turned Discover off, so you don’t appear here for others and don’t see them.",
  turnOn: "Turn it back on in Me",
  noSchedule: "Add your schedule first to find people who share your courses.",
  addSchedule: "Add my schedule",
  people: "People",
  nobody: "Nobody new shares your courses yet. Invite your section from the search on Now.",
  /** "3/5 courses" in common. */
  shared: (n: number, total: number) => `${n}/${total} courses`,
  byCourse: "By course",
  /** New people per course, in the By course list. */
  courseCount: (n: number) => (n === 0 ? "nobody new" : n === 1 ? "1 person" : `${n} people`),
  /** A course's page. */
  course: {
    nobody: "Nobody new here yet.",
    strangers: (n: number) => `${n} ${n === 1 ? "person" : "people"} you don’t know yet`,
    friends: (n: number) => `${n} of your people also take it`,
  },
};

export default discover;
