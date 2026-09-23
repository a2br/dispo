const status = {
  noSchedule: "No schedule yet",
  private: "Schedule is private",
  giveToGet: "Add your schedule to see",
  busyUntil: (time: string) => `Busy until ${time}`,
  freeRestOfDay: "Free for the rest of the day",
  freeUntil: (time: string) => `Free until ${time}`,
  then: (course: string) => `Then ${course}`,
  busy: "Busy",
};

export default status;
