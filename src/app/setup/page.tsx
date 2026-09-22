import type { Metadata } from "next";
import { requireUser, safeNext } from "@/lib/auth";
import { CalendarLinkForm } from "@/components/CalendarLinkForm";
import { ExternalLink } from "@/components/ExternalLink";

export const metadata: Metadata = { title: "Add your schedule" };

/** One screen, no scrolling: three short steps, then a single paste button. */
export default async function SetupPage({ searchParams }: PageProps<"/setup">) {
  await requireUser();
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null) ?? undefined;
  const steps: React.ReactNode[] = [
    <>
      Open <b>EPFL Campus</b> → <b>Schedule</b> <span className="text-muted">(or <ExternalLink href="https://campus.epfl.ch">campus.epfl.ch</ExternalLink>)</span>
    </>,
    <>
      Tap <b>⋯</b> → <b>Export</b> → <b>Copy link</b>
    </>,
    <>Come back and tap the button below</>,
  ];
  return (
    <main className="mx-auto max-w-md min-h-[calc(100dvh-var(--nav-h))] flex flex-col justify-center py-6 gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Add your schedule</h1>
        <p className="text-muted">One paste. It stays in sync with IS-Academia on its own.</p>
      </header>

      <ol className="border border-line divide-y divide-line">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 px-3 py-2.5">
            <span className="size-6 shrink-0 rounded-sm bg-foreground text-background grid place-items-center text-xs font-bold">{i + 1}</span>
            <span className="leading-6">{step}</span>
          </li>
        ))}
      </ol>

      <CalendarLinkForm next={next} />

      <p className="text-xs text-muted">The link contains a private key: it’s stored encrypted and only used to refresh your timetable. Remove it anytime in Me.</p>
    </main>
  );
}
