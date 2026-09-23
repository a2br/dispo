"use client";

import { useActionState, useRef, useState } from "react";
import { saveCalendarLink, type FormState } from "@/app/actions";
import { useT } from "@/i18n/client";
import { button, input } from "@/lib/ui";

/**
 * Paste-first: on a phone the link is already on the clipboard (copied from IS-Academia),
 * so one tap reads it and submits. The text field stays as a fallback.
 */
export function CalendarLinkForm({ stay = false, compact = false, next }: { stay?: boolean; compact?: boolean; next?: string }) {
  const t = useT().setup.form;
  const [state, action, pending] = useActionState<FormState, FormData>(saveCalendarLink, undefined);
  const [value, setValue] = useState("");
  const [clipError, setClipError] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  async function pasteAndSubmit() {
    setClipError(null);
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!/^(https?|webcal):\/\//i.test(text)) {
        setClipError(t.clipboardNoLink);
        return;
      }
      setValue(text);
      // let React commit the value before submitting
      requestAnimationFrame(() => form.current?.requestSubmit());
    } catch {
      setClipError(t.clipboardFailed);
    }
  }

  return (
    <form ref={form} action={action} className="space-y-3">
      {stay && <input type="hidden" name="then" value="stay" />}
      {next && <input type="hidden" name="next" value={next} />}
      {!compact && (
        <button type="button" onClick={pasteAndSubmit} disabled={pending} className={button("primary", "lg", "w-full")}>
          {pending ? t.fetching : t.paste}
        </button>
      )}
      <div className="flex gap-2">
        <input
          name="url"
          type="url"
          inputMode="url"
          required
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={compact ? t.placeholderReplace : t.placeholder}
          className={input("md", "flex-1 w-auto min-w-0 font-mono")}
        />
        <button type="submit" disabled={pending || !value} className={button(compact ? "primary" : "secondary", "md")}>
          {compact ? t.replace : t.connect}
        </button>
      </div>
      {clipError && <p className="text-sm text-muted">{clipError}</p>}
      {state?.error && <p className="text-sm text-busy">{state.error}</p>}
      {state?.ok && <p className="text-sm text-free">{state.ok}</p>}
      {pending && compact && <p className="text-sm text-muted">{t.fetching}</p>}
    </form>
  );
}
