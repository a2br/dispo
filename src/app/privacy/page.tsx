import type { Metadata } from "next";
import Link from "next/link";
import { LOCALE_TAGS } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { sectionTitle } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).pages.privacy.title };
}

const CONTACT = "anatole.debierre@gmail.com";
/** September 23, 2026. */
const UPDATED = Date.UTC(2026, 8, 23);

export default async function Privacy() {
  const t = (await getT()).pages.privacy;
  const updated = new Intl.DateTimeFormat(LOCALE_TAGS[await getLocale()], { dateStyle: "long", timeZone: "UTC" }).format(UPDATED);
  return (
    <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6 text-[15px] leading-relaxed">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted">{t.updated(updated)}</p>
      </header>

      <p>{t.intro}</p>

      <section className="space-y-2">
        <h2 className={sectionTitle}>{t.stores.title}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t.stores.google}</li>
          <li>{t.stores.link}</li>
          <li>{t.stores.classes}</li>
          <li>{t.stores.app}</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>{t.who.title}</h2>
        <p>
          {t.who.before}
          <Link href="/me" className="link">{t.who.profile}</Link>
          {t.who.after}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>{t.where.title}</h2>
        <p>{t.where.text}</p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>{t.delete.title}</h2>
        <p>
          {t.delete.before}
          <a href={`mailto:${CONTACT}`} className="link">{CONTACT}</a>
          {t.delete.after}
        </p>
      </section>
    </main>
  );
}
