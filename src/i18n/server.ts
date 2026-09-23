import { cookies, headers } from "next/headers";
import { cache } from "react";
import { and, eq, isNull } from "drizzle-orm";
import { db, dbReady, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { isLocale, LOCALE_COOKIE, negotiate, type Locale } from "./config";
import { messages, type Messages } from "./messages";

/** Language of a signed-out request: the picked one (cookie), else the browser's. */
export async function requestLocale(): Promise<Locale> {
  const picked = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(picked)) return picked;
  return negotiate((await headers()).get("accept-language"));
}

/**
 * Language for this request: the account's when signed in, else `requestLocale()`. Memoized per request.
 * Accounts from before languages existed have none: English was never their choice, so the first visit
 * saves the device's language to the account instead.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const user = await getUser();
  if (isLocale(user?.locale)) return user.locale;
  const locale = await requestLocale();
  if (user) {
    await dbReady;
    await db
      .update(schema.users)
      .set({ locale })
      .where(and(eq(schema.users.id, user.id), isNull(schema.users.locale)));
  }
  return locale;
});

/** Messages for this request. Server components, actions and route handlers. */
export async function getT(): Promise<Messages> {
  return messages[await getLocale()];
}

/** Remember a language on this browser, for when nobody is signed in. */
export async function rememberLocale(locale: Locale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
}
