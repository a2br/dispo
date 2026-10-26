import { card, check, sectionTitle } from "@/lib/ui";
import { ChevronRight } from "./Icons";

/*
 * Building blocks for settings screens (Me, a group's settings), so every section has the same title,
 * card and row spacing. A section is a titled card; its rows are split by hairlines and padded alike.
 * Layout rule: one control sits at the end of its row (wrapping under the text on phones); several go
 * underneath in a `ButtonRow`, destructive last. Controls in a settings card are `sm`.
 */

export function SettingsSection({ title, id, children }: { title: React.ReactNode; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-2 scroll-mt-6">
      <h2 className={sectionTitle}>{title}</h2>
      <div className={`${card} divide-y divide-line`}>{children}</div>
    </section>
  );
}

function RowText({ title, hint }: { title?: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <span className="block flex-1 min-w-[12rem]">
      {title && <span className="block font-bold">{title}</span>}
      {hint && <span className="block text-sm text-muted">{hint}</span>}
    </span>
  );
}

/** A row: title and hint, an optional `action` at the end, and anything else (a form, buttons) underneath. */
export function SettingsRow({ title, hint, action, children }: { title?: React.ReactNode; hint?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-3 space-y-3">
      {(title || hint || action) && (
        // With a title, the control lines up with it; next to a bare hint, it's centred.
        <div className={`flex flex-wrap gap-x-4 gap-y-3 ${title ? "items-start" : "items-center"}`}>
          {(title || hint) && <RowText title={title} hint={hint} />}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** One option of a radio list: the whole row is the label. Goes straight inside a card with `divide-y`. */
export function SettingsChoice({ name, value, defaultChecked, title, hint }: { name: string; value: string; defaultChecked: boolean; title: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-subtle">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className={`${check} mt-1`} />
      <RowText title={title} hint={hint} />
    </label>
  );
}

/** A row that opens to show more (a form you rarely need). */
export function SettingsDisclosure({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 px-4 py-3 font-bold cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-subtle">
        <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
        {title}
      </summary>
      <div className="px-4 pb-3 space-y-3">{children}</div>
    </details>
  );
}

/** Buttons side by side, wrapping on phones. */
export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/** On/off switch over a real checkbox, so it submits with its form and works with the keyboard. */
export function Switch({ pending = false, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & { pending?: boolean }) {
  return (
    <label className={`relative inline-flex shrink-0 cursor-pointer items-center ${pending ? "opacity-60" : ""}`}>
      <input type="checkbox" {...props} className="peer sr-only" />
      <span className="h-6 w-11 rounded-sm bg-line-strong/60 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted" />
      <span className="absolute left-0.5 top-0.5 size-5 rounded-sm bg-white transition-transform duration-200 peer-checked:translate-x-5" />
    </label>
  );
}
