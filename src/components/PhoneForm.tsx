"use client";

import { useActionState } from "react";
import { setPhone, type PhoneState } from "@/app/actions";
import { useT } from "@/i18n/client";
import { button, input } from "@/lib/ui";
import { SettingsRow } from "./Settings";

export function PhoneForm({ phone }: { phone: string | null }) {
  const t = useT();
  const [state, action, pending] = useActionState<PhoneState, FormData>(setPhone, undefined);
  return (
    <SettingsRow
      title={
        <label htmlFor="phone">
          {t.me.phone.label} <span className="font-normal text-muted">{t.me.phone.optional}</span>
        </label>
      }
      hint={t.me.phone.hint}
    >
      <form action={action} className="space-y-2">
        <div className="flex gap-2">
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={phone ?? ""} placeholder="+41 79 123 45 67" className={input("sm", "flex-1 w-auto min-w-0")} />
          <button type="submit" disabled={pending} className={button("secondary")}>
            {t.common.save}
          </button>
        </div>
        {state?.error && <p className="text-sm text-busy">{state.error}</p>}
        {state?.ok && <p className="text-sm text-free">{state.ok}</p>}
      </form>
    </SettingsRow>
  );
}
