import { mergeBlocks } from "@/lib/blocks";
import { eventsBetween, getCalendar } from "@/lib/calendar";
import { userByShareCode } from "@/lib/invites";
import { shareCard, weekCard } from "@/lib/og";
import { addDays, weekStartFromParam } from "@/lib/time";

async function card(code: string, w: string | undefined) {
  const owner = await userByShareCode(code);
  if (!owner) return shareCard({ title: "Someone’s week", subtitle: "See when they’re free. Open it, no sign-up needed." });
  const first = owner.name.split(" ")[0];
  if (!(await getCalendar(owner.id))) return shareCard({ eyebrow: "Free / busy", title: `${first}’s week`, subtitle: `${first} hasn’t added a schedule yet.` });
  const weekStart = weekStartFromParam(w);
  const events = await eventsBetween(owner.id, weekStart, addDays(weekStart, 7));
  return weekCard({ name: owner.name, weekStart, blocks: mergeBlocks(events) });
}

/**
 * Share preview for /s/[code]?w=…, linked from the page's metadata. A plain route rather than
 * opengraph-image.tsx, which can't read `?w=`: the preview must draw the week the link opens on.
 * Same data the public page shows: that week's merged busy blocks, no course names.
 */
export async function GET(req: Request, { params }: RouteContext<"/s/[code]/og">) {
  const { code } = await params;
  const res = await card(code, new URL(req.url).searchParams.get("w") ?? undefined);
  // ImageResponse defaults to a year-long immutable cache, but a week's timetable can still change.
  res.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return res;
}
