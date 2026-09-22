/**
 * Feature switches, read on the server. Classmates discovery is a different use case from
 * checking friends' availability, so it ships off by default: FEATURE_CLASSMATES=1 turns on
 * the Classes tab, /classmates, /course/[key] and the shared-courses line on profiles.
 */
export const features = {
  classmates: process.env.FEATURE_CLASSMATES === "1",
};
