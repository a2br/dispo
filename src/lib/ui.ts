/**
 * Shared style recipes. Anything clickable uses `button()` / `iconButton()` / `segment()`, so controls
 * that sit next to each other share one height and one shape. Sizes:
 *   sm = 32px  every button that isn't full width, chips, segmented controls, and inputs that sit in a
 *              row with them (default). Settings screens (Me, a group's settings) use sm throughout.
 *   md = 40px  full-width buttons, and forms built around a text field (sign-in, setup, sheets)
 *   lg = 48px  the one full-width main call to action on a screen
 * Rules: buttons in the same card or section share one size, and a card has at most one `primary`.
 * Every button is a box (filled or outlined) except `quiet`, which is for cancel, clear and removing
 * an item from a list. Settings rows: see `components/Settings.tsx`.
 */

export type ButtonVariant =
  | "primary" // EPFL red fill: the main action
  | "secondary" // outlined: everything else
  | "dark" // foreground fill: confirm in a neutral context
  | "success" // canard fill: accept
  | "dangerSolid" // groseille fill: confirm a destructive action
  | "danger" // outlined, red text: destructive entry point
  | "quiet" // text only: cancel, clear, remove from a list
  | "add"; // dashed outline, red text: add something

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-1.5 font-bold whitespace-nowrap select-none transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none";

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
  danger: "border border-line-strong bg-surface text-busy hover:bg-subtle",
  quiet: "text-muted hover:text-foreground hover:bg-subtle",
  add: "border border-dashed border-line-strong text-accent-ink hover:bg-subtle",
};

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export function button(variant: ButtonVariant = "secondary", size: ButtonSize = "sm", extra?: string | false): string {
  return cx(BASE, "rounded-sm", SIZE[size], VARIANT[variant], extra);
}

/** Square button for a single glyph (arrows, ×, back). */
export function iconButton(variant: ButtonVariant = "secondary", size: ButtonSize = "sm", extra?: string | false): string {
  return cx(BASE, "rounded-sm", ICON_SIZE[size], VARIANT[variant], "px-0 text-base leading-none", extra);
}

/**
 * Segmented control: options joined into one outlined bar, the chosen one filled. `segmented` goes on
 * the container, `segment()` on each option (a submit button, or a label around a hidden radio).
 */
export function segmented(extra?: string | false): string {
  return cx("flex", extra);
}

export function segment(chosen: boolean, size: ButtonSize = "sm", extra?: string | false): string {
  return cx(
    BASE,
    SIZE[size],
    "relative flex-1 cursor-pointer border -ml-px first:ml-0 first:rounded-l-sm last:rounded-r-sm",
    "focus-visible:z-[2] has-focus-visible:z-[2] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-muted",
    chosen ? "z-[1] border-foreground bg-foreground text-background" : "border-line-strong bg-surface text-foreground hover:bg-subtle",
    extra,
  );
}

/** Native radio or checkbox, ticked in the accent colour (like the switch in `Settings.tsx`). */
export const check = "size-4 shrink-0 cursor-pointer accent-[var(--accent)]";

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
