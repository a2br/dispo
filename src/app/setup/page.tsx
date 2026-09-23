import type { Metadata } from "next";
import { requireUser, safeNext } from "@/lib/auth";
import { CalendarLinkForm } from "@/components/CalendarLinkForm";
import { ExternalLink } from "@/components/ExternalLink";
import { getT } from "@/i18n/server";

/** Opens the schedule with the iCal export pop-up already showing, so it's one tap to copy the link. */
const ICS_EXPORT_URL = "https://campus.epfl.ch/isacademia/schedule?view=work_week#/isacademia/ics?createStack=1";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).setup.title };
}

/** One screen, no scrolling: three short steps, then a single paste button. */
export default async function SetupPage({ searchParams }: PageProps<"/setup">) {
  await requireUser();
  const t = (await getT()).setup;
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null) ?? undefined;
  const steps: React.ReactNode[] = [
    <>
      {t.step1.before}
      <ExternalLink href={ICS_EXPORT_URL}>{t.step1.link}</ExternalLink>
      {t.step1.after} <span className="text-muted">{t.step1.note}</span>
    </>,
    <>
      {t.step2.before}
      <b>{t.step2.button}</b>
      {t.step2.after} <span className="text-muted">{t.step2.note}</span>
    </>,
    <>{t.step3}</>,
  ];
  return (
    <main className="mx-auto max-w-md min-h-[calc(100dvh-var(--nav-h))] flex flex-col justify-center py-6 gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted">{t.lede}</p>
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

      <p className="text-xs text-muted">{t.fineprint}</p>
    </main>
  );
}
