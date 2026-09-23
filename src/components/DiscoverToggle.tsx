"use client";

import { useRef, useTransition } from "react";
import { setDiscoverable } from "@/app/actions";
import { useT } from "@/i18n/client";

/** Switch that saves as soon as it's flipped. */
export function DiscoverToggle({ on }: { on: boolean }) {
  const t = useT().me.discover;
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form ref={form} action={setDiscoverable} className="flex items-start gap-3 px-4 py-3">
      <span className="flex-1">
        <span className="block font-bold">{t.toggle}</span>
        <span className="block text-sm text-muted">{t.toggleHint}</span>
      </span>
      <label className={`relative inline-flex shrink-0 cursor-pointer items-center mt-0.5 ${pending ? "opacity-60" : ""}`}>
        <input
          type="checkbox"
          name="discoverable"
          defaultChecked={on}
          onChange={() => start(() => form.current?.requestSubmit())}
          className="peer sr-only"
          aria-label={t.toggle}
        />
        <span className="h-6 w-11 rounded-sm bg-line-strong/60 transition-colors peer-checked:bg-free peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-sm bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
      </label>
    </form>
  );
}
