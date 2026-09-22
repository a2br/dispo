/**
 * Shared style recipes. Anything clickable uses `button()` / `iconButton()`, so controls that sit
 * next to each other share one height and one shape. Sizes:
 *   sm = 32px  inline actions, rows of controls, chips (the default)
 *   md = 40px  form submits, full-width actions
 *   lg = 48px  the one main call to action on a screen
 */

export type ButtonVariant =
  | "primary" // EPFL red fill: the main action
  | "secondary" // outlined: everything else
  | "dark" // foreground fill: confirm in a neutral context
  | "success" // canard fill: accept
  | "dangerSolid" // groseille fill: confirm a destructive action
  | "danger" // red text: destructive entry point
  | "quiet" // text only: cancel, clear
  | "add"; // dashed outline, red text: add something

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-sm font-bold whitespace-nowrap select-none transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none";

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const ICON_SIZE: Record<ButtonSize, string> = { sm: "size-8", md: "size-10", lg: "size-12" };

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-dark",
  secondary: "border border-line-strong bg-surface text-foreground hover:bg-subtle",
  dark: "bg-foreground text-background hover:opacity-85",
  success: "bg-free text-white hover:opacity-90",
  dangerSolid: "bg-busy text-white hover:opacity-90",
  danger: "text-busy hover:bg-subtle",
  quiet: "text-muted hover:text-foreground hover:bg-subtle",
  add: "border border-dashed border-line-strong text-accent-ink hover:bg-subtle",
};

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export function button(variant: ButtonVariant = "secondary", size: ButtonSize = "sm", extra?: string | false): string {
  return cx(BASE, SIZE[size], VARIANT[variant], extra);
}

/** Square button for a single glyph (arrows, ×, back). */
export function iconButton(variant: ButtonVariant = "secondary", size: ButtonSize = "sm", extra?: string | false): string {
  return cx(BASE, ICON_SIZE[size], VARIANT[variant], "px-0 text-base leading-none", extra);
}

/** Non-interactive pill of the same height as `sm` buttons (people in a view, groups). */
export function chip(extra?: string | false): string {
  return cx("inline-flex items-center gap-1.5 rounded-sm border border-line bg-subtle h-8 px-2.5 text-sm whitespace-nowrap", extra);
}

export function input(size: ButtonSize = "md", extra?: string | false): string {
  return cx(
    "w-full rounded-sm bg-surface border border-line-strong px-3 outline-none transition-colors focus:border-foreground placeholder:text-muted",
    // 16px on phones: iOS zooms into any field with smaller text when it's focused.
    size === "sm" ? "h-8 text-base sm:text-sm" : size === "md" ? "h-10 text-base" : "h-12 text-base",
    extra,
  );
}

export const sectionTitle = "text-sm font-bold text-muted uppercase tracking-wide";
export const card = "border border-line bg-surface";
