import type { Messages } from "../en";

const discover: Messages["discover"] = {
  title: "Découvrir",
  lede: "Les personnes qui ont des cours en commun avec toi et qui ne sont pas encore dans tes contacts. Seuls vos cours communs sont affichés.",
  off: "Tu as désactivé Découvrir : tu n’apparais plus ici pour les autres et tu ne les vois pas.",
  turnOn: "Le réactiver dans Moi",
  noSchedule: "Ajoute d’abord ton horaire pour trouver les personnes qui ont les mêmes cours que toi.",
  addSchedule: "Ajouter mon horaire",
  people: "Personnes",
  nobody: "Personne de nouveau n’a encore de cours en commun avec toi. Invite ta section depuis la recherche sur Maintenant.",
  shared: (n, total) => `${n}/${total} cours`,
  byCourse: "Par cours",
  courseCount: (n) => (n === 0 ? "personne de nouveau" : n === 1 ? "1 personne" : `${n} personnes`),
  course: {
    nobody: "Personne de nouveau ici pour l’instant.",
    strangers: (n) => `${n} ${n <= 1 ? "personne que tu ne connais" : "personnes que tu ne connais"} pas encore`,
    friends: (n) => `${n} de tes contacts ${n <= 1 ? "suit" : "suivent"} aussi ce cours`,
  },
};

export default discover;
