import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { getCalendar } from "@/lib/calendar";
import { acceptPersonalInvite } from "@/lib/invites";

/** Step after sign-in (or a tap): connect with the inviter, then land on their week. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/i/[code]/accept">) {
  const { code } = await ctx.params;
  const user = await getUser();
  if (!user) redirect(`/i/${code}`);
  const inviter = await acceptPersonalInvite(user, code);
  if (!inviter) redirect("/");
  const dest = inviter.id === user.id ? "/" : `/u/${inviter.id}`;
  redirect((await getCalendar(user.id)) ? dest : `/setup?next=${encodeURIComponent(dest)}`);
}
