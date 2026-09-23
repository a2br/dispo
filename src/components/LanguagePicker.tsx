import { setLanguage } from "@/app/actions";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/config";
import { button } from "@/lib/ui";

/**
 * English / Français / Deutsch. Works without JavaScript: each language is a submit button.
 * `quiet` is the landing page's row of text links; otherwise a segmented control.
 */
export function LanguagePicker({ current, quiet = false }: { current: Locale; quiet?: boolean }) {
  if (quiet)
    return (
      <form action={setLanguage} className="flex gap-3 text-xs">
        {LOCALES.map((l) => (
          <button key={l} name="locale" value={l} lang={l} aria-current={l === current || undefined} className={l === current ? "font-bold" : "text-muted hover:text-foreground underline"}>
            {LOCALE_NAMES[l]}
          </button>
        ))}
      </form>
    );
  return (
    <form action={setLanguage} className="grid grid-cols-3 gap-2">
      {LOCALES.map((l) => (
        <button key={l} name="locale" value={l} lang={l} aria-pressed={l === current} className={button(l === current ? "dark" : "secondary", "md")}>
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </form>
  );
}
