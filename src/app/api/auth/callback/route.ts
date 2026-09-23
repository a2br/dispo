import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { AuthError, createSession, finishGoogleLogin, type AuthErrorCode } from "@/lib/auth";
import { getCalendar } from "@/lib/calendar";
import { rememberLocale, requestLocale } from "@/i18n/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");
  // The landing page words the error in the reader's language (t.auth.errors).
  if (err || !code || !state) redirect("/?error=cancelled");
  let dest = "/";
  try {
    const { user, next } = await finishGoogleLogin(code, state, await requestLocale());
    await createSession(user.id);
    // The account's language also sticks to this browser, so signing out doesn't switch it.
    if (user.locale) await rememberLocale(user.locale);
    // Invite links finish their own flow (join, connect, then setup if needed).
    dest = next ?? ((await getCalendar(user.id)) ? "/" : "/setup");
  } catch (e) {
    const reason: AuthErrorCode = e instanceof AuthError ? e.code : "failed";
    if (e instanceof AuthError) console.warn("google callback:", e.message);
    else console.error("google callback", e);
    redirect("/?error=" + reason);
  }
  redirect(dest);
}
