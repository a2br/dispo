"use client";

import { useRef, useTransition } from "react";
import { setDiscoverable } from "@/app/actions";
import { useT } from "@/i18n/client";
import { SettingsRow, Switch } from "./Settings";

/** Switch that saves as soon as it's flipped. */
export function DiscoverToggle({ on }: { on: boolean }) {
  const t = useT().me.discover;
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <SettingsRow
      title={t.toggle}
      hint={t.toggleHint}
      action={
        <form ref={form} action={setDiscoverable}>
          <Switch name="discoverable" defaultChecked={on} onChange={() => start(() => form.current?.requestSubmit())} aria-label={t.toggle} pending={pending} />
        </form>
      }
    />
  );
}
