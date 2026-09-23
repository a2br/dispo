import type { Messages } from "../en";

const status: Messages["status"] = {
  noSchedule: "Pas encore d’horaire",
  private: "Horaire privé",
  giveToGet: "Ajoute ton horaire pour voir",
  busyUntil: (time) => `En cours jusqu’à ${time}`,
  freeRestOfDay: "Libre pour le reste de la journée",
  freeUntil: (time) => `Libre jusqu’à ${time}`,
  then: (course) => `Ensuite ${course}`,
  busy: "Occupé",
};

export default status;
