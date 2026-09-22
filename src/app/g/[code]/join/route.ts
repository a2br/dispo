import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getCalendar } from "@/lib/calendar";
import { joinGroup } from "@/lib/invites";

/** Step after sign-in (or a tap): join the group, connect with everyone in it, open the group's calendar. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/g/[code]/join">) {
  const { code } = await ctx.params;
  const user = await getUser();
  if (!user) redirect(`/g/${code}`);
  const inv = await joinGroup(user, code);
  if (!inv) redirect("/");
  const others = inv.people.filter((p) => p.id !== user.id).map((p) => p.id);
  const dest = others.length ? `/calendar?with=${others.join(",")}` : `/g/${code}`;
  redirect((await getCalendar(user.id)) ? dest : `/setup?next=${encodeURIComponent(dest)}`);
}
