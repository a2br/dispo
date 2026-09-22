"use client";

import { useActionState } from "react";
import { saveCalendarLink, type FormState } from "@/app/actions";

export function CalendarLinkForm({ stay = false, compact = false }: { stay?: boolean; compact?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCalendarLink, undefined);
  return (
    <form action={action} className="space-y-3">
      {stay && <input type="hidden" name="then" value="stay" />}
      <input
        name="url"
        type="url"
        inputMode="url"
        required
        autoComplete="off"
        spellCheck={false}
        placeholder="https://campus.epfl.ch/…?action=get_ics&key=…"
        className="w-full rounded-2xl bg-surface border border-line px-4 py-3 text-sm outline-none focus:border-foreground/40 font-mono"
      />
      {state?.error && <p className="text-sm text-busy">{state.error}</p>}
      {state?.ok && <p className="text-sm text-free">{state.ok}</p>}
      <button
        type="submit"
        disabled={pending}
        className={`w-full rounded-2xl bg-accent text-white font-semibold ${compact ? "py-2.5" : "py-3"} disabled:opacity-60 active:opacity-80`}
      >
        {pending ? "Fetching your schedule…" : compact ? "Replace link" : "Connect my schedule"}
      </button>
    </form>
  );
}
