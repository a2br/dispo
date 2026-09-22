import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { CalendarLinkForm } from "@/components/CalendarLinkForm";

export const metadata: Metadata = { title: "Add your schedule" };

export default async function SetupPage() {
  await requireUser();
  return (
    <main className="mx-auto max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add your schedule</h1>
        <p className="text-muted mt-1">One paste, and it stays in sync with IS-Academia automatically.</p>
      </div>

      <ol className="rounded-2xl bg-surface border border-line divide-y divide-line text-sm">
        <li className="flex gap-3 px-4 py-3"><Step n={1} /> Open the <b>EPFL Campus</b> app and go to <b>Schedule</b>.</li>
        <li className="flex gap-3 px-4 py-3"><Step n={2} /> Tap the <b>⋯ / Export</b> button and choose <b>Copy link</b> (the one you’d add to your phone’s calendar).</li>
        <li className="flex gap-3 px-4 py-3"><Step n={3} /> Paste it below. IS-Academia’s own “Export iCalendar” link works too.</li>
      </ol>

      <CalendarLinkForm />

      <p className="text-xs text-muted">
        The link contains a private key, so it’s stored encrypted and only used by the server to refresh your timetable. You can remove it anytime in Settings.
      </p>
    </main>
  );
}

function Step({ n }: { n: number }) {
  return <span className="size-6 shrink-0 rounded-full bg-foreground text-background grid place-items-center text-xs font-semibold">{n}</span>;
}
