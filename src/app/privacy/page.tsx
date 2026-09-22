import type { Metadata } from "next";
import Link from "next/link";
import { sectionTitle } from "@/lib/ui";

export const metadata: Metadata = { title: "Privacy" };

const CONTACT = "anatole.debierre@gmail.com";

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl py-6 md:py-10 space-y-6 text-[15px] leading-relaxed">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Privacy</h1>
        <p className="text-sm text-muted">Last updated September 22, 2026</p>
      </header>

      <p>
        dispo is a small student project that shows EPFL friends when each other are free. It is not affiliated with
        EPFL. This page says what it stores and why.
      </p>

      <section className="space-y-2">
        <h2 className={sectionTitle}>What dispo stores</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>From Google sign-in: your name and @epfl.ch email address. Nothing else from your Google account, not even your profile picture.</li>
          <li>
            The calendar link you paste from IS-Academia, encrypted (AES-256-GCM). It is never shown to anyone,
            including you after you save it.
          </li>
          <li>The classes in that calendar (course, time, room, teacher), refreshed a few times a day.</li>
          <li>What you set up in the app: connections, groups, pinned people, visibility settings and, if you add one, your phone number.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Who sees it</h2>
        <p>
          Other signed-in users see your schedule according to your setting on <Link href="/me" className="link">your profile</Link>:
          everyone at EPFL (the default), free/busy for everyone with details only for your connections, or connections only. A public link, if you create one, shows free/busy only, without course
          names or rooms. Your data is not sold, shared with third parties or used for ads.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Where it lives</h2>
        <p>
          The app runs on Vercel and the database on Turso, both in the EU (Ireland). A session cookie keeps you signed
          in; there are no analytics or tracking cookies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Deleting your data</h2>
        <p>
          Email <a href={`mailto:${CONTACT}`} className="link">{CONTACT}</a> from your EPFL address and your account and
          everything linked to it will be deleted.
        </p>
      </section>
    </main>
  );
}
