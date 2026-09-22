"use client";

import { useRef, useTransition } from "react";
import { setDiscoverable } from "@/app/actions";

/** Switch that saves as soon as it's flipped. */
export function DiscoverToggle({ on }: { on: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form ref={form} action={setDiscoverable} className="flex items-start gap-3 px-4 py-3">
      <span className="flex-1">
        <span className="block font-bold">Show me in Discover</span>
        <span className="block text-sm text-muted">
          People who share your courses can find you there, and you can find them. Turned off, you disappear from Discover and it’s hidden for you. Name search follows your visibility above.
        </span>
      </span>
      <label className={`relative inline-flex shrink-0 cursor-pointer items-center mt-0.5 ${pending ? "opacity-60" : ""}`}>
        <input
          type="checkbox"
          name="discoverable"
          defaultChecked={on}
          onChange={() => start(() => form.current?.requestSubmit())}
          className="peer sr-only"
          aria-label="Show me in Discover"
        />
        <span className="h-6 w-11 rounded-sm bg-line-strong/60 transition-colors peer-checked:bg-free peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-sm bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
      </label>
    </form>
  );
}
