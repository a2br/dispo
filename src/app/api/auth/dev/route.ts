import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createSession, devLoginEnabled, isEpflEmail, upsertUserFromProfile } from "@/lib/auth";
import { getCalendar } from "@/lib/calendar";

/** Local development only: /api/auth/dev?email=jane.doe@epfl.ch&name=Jane%20Doe */
export async function GET(req: NextRequest) {
  if (!devLoginEnabled()) return new Response("Not found", { status: 404 });
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const name = req.nextUrl.searchParams.get("name");
  if (!isEpflEmail(email)) return new Response("email must be @epfl.ch", { status: 400 });
  const user = await upsertUserFromProfile({ email, name });
  await createSession(user.id);
  redirect((await getCalendar(user.id)) ? "/" : "/setup");
}
