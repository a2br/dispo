"use client";

import { useActionState } from "react";
import { setPhone, type PhoneState } from "@/app/actions";
import { useT } from "@/i18n/client";
import { button, input } from "@/lib/ui";

export function PhoneForm({ phone }: { phone: string | null }) {
  const t = useT();
  const [state, action, pending] = useActionState<PhoneState, FormData>(setPhone, undefined);
  return (
    <form action={action} className="px-4 py-3 space-y-2 border-t border-line">
      <label htmlFor="phone" className="block font-bold">
        {t.me.phone.label} <span className="font-normal text-muted">{t.me.phone.optional}</span>
      </label>
      <p className="text-sm text-muted">{t.me.phone.hint}</p>
      <div className="flex gap-2">
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={phone ?? ""} placeholder="+41 79 123 45 67" className={input("md", "flex-1 w-auto min-w-0")} />
        <button type="submit" disabled={pending} className={button("secondary", "md")}>
          {t.common.save}
        </button>
      </div>
      {state?.error && <p className="text-sm text-busy">{state.error}</p>}
      {state?.ok && <p className="text-sm text-free">{state.ok}</p>}
    </form>
  );
}
