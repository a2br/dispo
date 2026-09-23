"use client";

import { useState } from "react";
import { button } from "@/lib/ui";
import { useT } from "@/i18n/client";

/**
 * A button that asks before doing something hard to undo. First tap reveals the question,
 * second tap on the red button submits `action` with the hidden `fields`.
 */
export function ConfirmAction({
  label,
  question,
  confirmLabel,
  fields,
  action,
  className,
}: {
  label: React.ReactNode;
  question: string;
  confirmLabel: string;
  fields: Record<string, string>;
  action: (formData: FormData) => Promise<void>;
  className: string;
}) {
  const t = useT();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={className}>
        {label}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2 animate-in">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <span className="text-sm text-muted">{question}</span>
      <button type="button" onClick={() => setAsking(false)} className={button("secondary")}>
        {t.groups.keep}
      </button>
      <button type="submit" className={button("dangerSolid")}>
        {confirmLabel}
      </button>
    </form>
  );
}
