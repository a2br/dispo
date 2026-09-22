import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { AuthError, createSession, finishGoogleLogin } from "@/lib/auth";
import { getCalendar } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");
  if (err || !code || !state) redirect("/?error=" + encodeURIComponent(err ?? "Login cancelled."));
  let dest = "/";
  try {
    const { user, next } = await finishGoogleLogin(code, state);
    await createSession(user.id);
    // Invite links finish their own flow (join, connect, then setup if needed).
    dest = next ?? ((await getCalendar(user.id)) ? "/" : "/setup");
  } catch (e) {
    const msg = e instanceof AuthError ? e.message : "Sign-in failed.";
    if (!(e instanceof AuthError)) console.error("google callback", e);
    redirect("/?error=" + encodeURIComponent(msg));
  }
  redirect(dest);
}
