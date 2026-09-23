/** Languages dispo speaks. English is the default and the fallback. */
export const LOCALES = ["en", "fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Signed-out language choice (signed in, the account's `users.locale` wins). */
export const LOCALE_COOKIE = "dispo_lang";

/**
 * BCP 47 tags for `<html lang>` and `Intl`. All Swiss: 24-hour times, Monday weeks, and de-CH
 * writes "ss" instead of "ß". en-CH (not en-US) keeps English on the same conventions.
 */
export const LOCALE_TAGS: Record<Locale, string> = { en: "en-CH", fr: "fr-CH", de: "de-CH" };

/** Each language named in itself, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", fr: "Français", de: "Deutsch" };

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

/** Best supported language for an `Accept-Language` header, by the browser's own ranking. */
export function negotiate(acceptLanguage: string | null | undefined): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.lang && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return ranked.map((x) => x.lang).find(isLocale) ?? DEFAULT_LOCALE;
}
