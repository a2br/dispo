# dispo

"Who's free?" for EPFL. Like peeking at a coworker's Google Calendar, but for
IS-Academia timetables, which live behind Gaspar and have no shared calendar server.

- Sign in with the EPFL Google account (Google for Education, restricted to `hd=epfl.ch`).
- Paste the calendar link from the EPFL Campus app once. The server keeps it in sync.
- Search anyone by name: everyone is findable, whatever their settings, so connection requests
  always work. Timetables are shared with everyone at EPFL by default, like a company calendar;
  "connections see details" and "connections only" are opt-in (a private schedule shows as
  "Schedule is private" with a Connect button).
- Give to get: until you've added your own schedule, you only see your connections' schedules.
  Everyone else shows "Add your schedule to see" (search, profiles, Discover, groups, calendar).
  Public links are the owner's choice and stay viewable by anyone.
- Search also queries the public EPFL directory (the JSON endpoint behind search.epfl.ch,
  `src/lib/directory.ts`) and lists matches who aren't on dispo yet with an Invite button.
  Invite opens the share sheet or an email draft; the app never sends anything itself.
  People who hide their directory profile don't appear. Private dispo users are shown as
  "not on dispo" so their membership stays hidden.
- Groups work like a group chat: everyone in a group sees it and every group has an invite
  link. Each group has one page (`/groups/<id>`): when everyone is next free, "Open in calendar",
  members, invite link, add people, rename, leave (creator can delete). Make one with "Create
  group" on Now. The calendar never offers to create a group: looking at someone stays silent.
  Your connections (and group-mates) are added directly; anyone else on dispo gets an invitation,
  shown as an Accept/Decline prompt on their Now tab. Pending invites are listed on the group page.
- Calendar: one place for your week and for comparing with others. It only chooses who is in
  view: "+ People" opens one list (search, your groups, your people with tick boxes). On its own it
  shows your week; with people it switches to the side-by-side comparison. When the view is
  exactly a group, a link to that group's page appears. Pick several friends and see everyone's free/busy side by side for a day,
  plus the slots this week (08:00–19:00, 30 min or more) where you're all free. Shows only
  merged busy blocks, never course names.
- Discover (`/discover`, a subscreen of Now with a back button): people you're not connected
  to, ranked by shared courses, with Connect on each row, plus a per-course breakdown. People shows
  a capped "Classmates" preview (5 people sharing 2+ courses) linking to it. Only courses in
  common are revealed. Anyone can opt out in Me: they disappear from Discover and it's hidden for
  them. An optional phone number (Me → Discover) is shown to classmates and connections.
  `FEATURE_CLASSMATES=0` turns the whole feature off.

Mobile-first PWA (add to home screen). On tablets and laptops the bottom bar becomes a
sidebar, friends get a timeline of their day, and pages spread into columns.

## Languages

English, French and German (Swiss conventions: `en-CH` / `fr-CH` / `de-CH`, 24-hour times, no "ß").
Signed in, the language is saved on the account (`users.locale`, set at sign-up from the browser,
changed in Me → Language) so it follows you across devices. Signed out, it's the `dispo_lang`
cookie (the landing page's language links), else the browser's `Accept-Language`.
Link previews (OG images and their titles) use the sender's language, since chat apps' crawlers
have none of their own.

- Messages live in `src/i18n/messages/{en,fr,de}/<namespace>.ts`. English is the source; French
  and German are typed against it, so a missing or extra key fails `tsc`.
- Server code: `await getT()` / `await getLocale()` from `@/i18n/server`. Client components:
  `useT()` / `useLocale()` from `@/i18n/client`. Dates go through `src/lib/time.ts` helpers that
  take a locale; course names come from IS-Academia and are never translated.

## Growth

- Personal invite link `/i/<code>`: "Anatole invited you". Signing in through it connects you
  with the inviter straight away, then setup, then their week.
- Group link `/g/<code>`, made for group chats: anyone who signs in through it joins the group,
  gets connected with everyone already in it, and lands in the group's calendar. Members opening
  the link go to the group page.
- Joining happens in `/i/<code>/accept` and `/g/<code>/join`, never on page view, so link
  previews and prefetches can't join anyone. Sign-in carries a safe `next` path through OAuth.
- Personalised titles, descriptions and Open Graph images for invite and group links (first
  names only, since previews are public), plus a default card.
- Directory search "Invite" and the home "Invite people" card use your personal link.
- Public view-only link `/s/<code>` (opt-in in Me, off by default): your week as free/busy
  only, no sign-up needed, noindex. It nudges visitors with an optional "See when we're both
  free" button (top) and a sign-in card (bottom); signing up through it connects them with you.
  "Reset link" issues a new code, which kills the old one.

## Home ("Now")

What people open the app for: who can I see, and when? An "Invite friends" card sits at the top
(dismissible with ×, remembered on the account), then "Find anyone at EPFL",
then one "Your people" list (pinned first, then free, then busy greyed out, then no schedule), then groups
with the next time everyone is free. New accounts get a two-step checklist (add schedule, bring
your people) instead. Search, Classmates and pending requests follow. Your own status lives at the
top of Me, not on Now. Stars pin people and groups
to the top of lists (home, and the calendar's "+ Add" panel); the calendar row itself stays clean.

## Design

Aligned with EPFL's visual identity (brand guidelines 2020 and the Elements web design
system), without the EPFL logo for now:

- Colours: rouge `#FF0000` for fills and marks only, groseille `#B51F1F` for red text and
  hover, canard `#007480` for "free", body text `#212121`, muted `#707070`, borders `#E6E6E6`.
  Course colours come from the brand palette (canard, léman, taupe, Elements info / warning /
  success). Tokens live in `src/app/globals.css`.
- Type: Arial, as on epfl.ch (Suisse Int'l is print-only and licensed). Bold for names and nav.
- Shape: flat, no shadows; 2px radius on controls, square cards. Links are underlined in red.
  Active nav items get Elements' small red square marker.
- Wordmark: lowercase "dispo." with a red dot; deliberately no red square or Swiss-cross
  motif (the EPFL logo may come later, with the SAC).
- Dark mode is our own extrapolation; EPFL doesn't define one.

Calendar screens fit the viewport exactly (`--nav-h` reserves the phone bar), so the whole
day is visible without page scrolling. Blocks carry no times: the hour axis shows them.
Navigation: Now, Calendar and Me (graduation-cap icon; profile & settings). On tablets and
laptops the nav is a floating card, top left. Week arrows are
identical, the label has a fixed width, and "Today" appears to their left, so nothing moves. Motion is short: colour transitions
on controls, a fade-up for new content, disabled under prefers-reduced-motion. Links that leave
the app open in a new tab (`ExternalLink`).
Week navigation is understated because most weeks repeat: "next" is a button, "previous" is
faint, "Today" only appears off-week.
Time blocks sit on top of the timetable: tap a class in your own week to skip it (once or every
week), or an empty hour / "Block time" to add busy time the feed doesn't have (a job, sport).
They're stored by time, not by event, so they survive feed refreshes; later blocks win where they
overlap. Every view reads events through `eventsFor`, which applies them, so Now, statuses, group
slots and share links all agree. Notes on busy blocks are private: others see "Busy".

## Stack

Next.js 16 (App Router, server actions), Tailwind 4, Drizzle + libsql (SQLite file
locally, Turso in production), `node-ical`, `jose` for the session cookie and Google
OIDC verification. No auth library: `src/lib/auth.ts` is the whole login flow.

```
src/
  app/            routes: / (Now), /groups/new, /groups/[id], /discover (+ /discover/[key]),
                  /calendar (?with= people), /i/[code], /g/[code], /s/[code] (public),
                  /u/[id] (someone's week), /setup, /me. Old /group, /classmates, /course/*
                  and ?g= links redirect.
                  flagged: /classmates, /course/[key]
  app/api/auth    google, callback, signout, dev (local only)
  app/api/cron    refresh  — re-fetch stale feeds, protected by CRON_SECRET
  app/api/search  name search (JSON)
  components/     AppNav (sidebar / bottom bar), WeekView (day timeline on phones, week grid on md+),
                  GroupWeek, GroupPicker, TodayStrip, SearchBox, …
  lib/            auth, calendar (ingest/refresh/queries), blocks (academic quarter), timeblocks
                  (skipped classes / own busy time), groupcalc, groups,
                  classmates (flagged), features, ics, access, time
  db/             schema + client (tables auto-created on first use)
scripts/seed-dev.ts   fake users sharing your feed, for local testing
scripts/add-user.ts   create a real user from an email, name and ICS link
```

## Run locally

```bash
cp .env.example .env.local     # then fill AUTH_SECRET, ICS_ENCRYPTION_KEY, CRON_SECRET
pnpm install
pnpm dev
```

Without Google credentials set `DEV_LOGIN="1"` and use the dev-login box on the landing
page (any `@epfl.ch` address). `ICS_URL=<your link>` in `.env.local` lets
`node --env-file=.env.local --import tsx scripts/seed-dev.ts` create a few fake people.

## Google sign-in

1. Google Cloud console → APIs & Services → Credentials → OAuth client ID, type *Web application*.
2. Authorized redirect URI: `$APP_URL/api/auth/callback`.
3. Put the client id/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. The consent screen can stay in "Testing" for internal use, or be set to *Internal* if the
   project lives in an EPFL Google Workspace org.

The server checks the ID token's `hd` claim and the email domain, so a non-EPFL Google
account cannot get a session even if it reaches the callback.

## Deploy

Vercel + Turso is the zero-ops path:

- `DATABASE_URL=libsql://…turso.io`, `DATABASE_AUTH_TOKEN=…`
- All the other variables from `.env.example`; leave `DEV_LOGIN` empty.
- `vercel.json` schedules `/api/cron/refresh` daily at 05:00 UTC (Hobby allows one run a day). Pages also refresh a feed
  older than 6 h in the background when someone views it.

## ICS format (verified 2026-09-22 against a real Campus-app link)

- URL: `https://campus.epfl.ch/deploy/backend_proxy/<id>/raw-isacademia?action=get_ics&key=<token>`.
  The `key` is a bearer token: anyone with the URL gets the schedule. Stored AES-GCM encrypted, never logged or displayed.
- Live feed, not a one-shot file: `X-PUBLISHED-TTL:PT6H`, generated by PocketCampus (iCal4j).
  Covers the current semester (~14 weeks). Presumably rolls over to spring on its own (to confirm in January).
- ~200 discrete VEVENTs, one per session. No RRULE/EXDATE on events (the only RRULEs
  are DST rules in VTIMEZONE), so no recurrence expansion is needed.
- `SUMMARY`: `<Course name> (<Kind>)` with Kind in {Courses, Exercises, Lab, Project}.
- `LOCATION`: room(s), comma-separated when several. Rarely absent.
- `DESCRIPTION`: Moodle link, `Course Code\n<CS-433>`, room map links, teacher + directory id.
- `DTSTART/DTEND` with `TZID=Europe/Zurich`; sessions start at :15 (the academic quarter).
  `src/lib/blocks.ts` snaps those starts to the full hour and merges touching sessions, so
  13:15–14:00 + 14:15–15:00 reads as 13:00–15:00. Statuses and free/busy views use the merged
  blocks; the detailed view keeps the real times.
- Stable numeric `UID`s: refresh upserts on UID and deletes what disappeared.

## Ideas not built yet

- Highlight shared sessions in a classmate's week view.
- Course-picker onboarding (derive a schedule from public course timetables) for people
  without the link. Less accurate for exercise groups, but zero paste.
- Groups (a section, a project team) as a shareable list.
- Push notification when a connection becomes free.

## License

MIT, see [LICENSE](LICENSE).
