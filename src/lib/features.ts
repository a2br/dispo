/**
 * Feature switches, read on the server.
 * Classmates (a capped "Classmates" section on People, the full list at /classmates and
 * /course/[key]) is on by default; FEATURE_CLASSMATES=0 turns it off.
 */
export const features = {
  classmates: process.env.FEATURE_CLASSMATES !== "0",
};
