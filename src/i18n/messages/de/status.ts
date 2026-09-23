import type { Messages } from "../en";

const status: Messages["status"] = {
  noSchedule: "Noch kein Stundenplan",
  private: "Stundenplan ist privat",
  giveToGet: "Füge deinen Stundenplan hinzu, um mehr zu sehen",
  busyUntil: (time) => `Beschäftigt bis ${time}`,
  freeRestOfDay: "Frei für den Rest des Tages",
  freeUntil: (time) => `Frei bis ${time}`,
  then: (course) => `Danach ${course}`,
  busy: "Beschäftigt",
};

export default status;
