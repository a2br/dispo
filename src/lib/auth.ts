import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { cache } from "react";
import { db, dbReady, schema } from "@/db";
import type { User } from "@/db/schema";

const SESSION_COOKIE = "dispo_session";
const SESSION_DAYS = 30;
export const EPFL_DOMAIN = "epfl.ch";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET missing or too short");
  return new TextEncoder().encode(s);
}

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function isEpflEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${EPFL_DOMAIN}`);
}

/** Only same-site paths are allowed as post-login destinations. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next.slice(0, 300);
}

// ---------- session ----------

export async function createSession(userId: string): Promise<void> {
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl().startsWith("https://"),
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current user or null. Memoized per request. */
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let sub: string | undefined;
  try {
    sub = (await jwtVerify(token, secret(), { algorithms: ["HS256"] })).payload.sub;
  } catch {
    return null; // bad or expired session cookie
  }
  if (!sub) return null;
  // Database errors are real failures: let them surface instead of silently signing people out.
  await dbReady;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, sub)).limit(1);
  return u ?? null;
});

export async function requireUser(): Promise<User> {
  const u = await getUser();
  if (!u) redirect("/");
  return u;
}

// ---------- users ----------

export async function upsertUserFromProfile(p: { email: string; name?: string | null; image?: string | null }): Promise<User> {
  await dbReady;
  const email = p.email.toLowerCase();
  const name = (p.name ?? "").trim() || email.split("@")[0].replace(/\./g, " ");
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) {
    const patch: Partial<User> = {};
    if (p.name && p.name !== existing.name) patch.name = p.name;
    if (p.image !== undefined && p.image !== existing.image) patch.image = p.image;
    if (Object.keys(patch).length) {
      await db.update(schema.users).set(patch).where(eq(schema.users.id, existing.id));
      return { ...existing, ...patch };
    }
    return existing;
  }
  const u: User = {
    id: crypto.randomUUID(),
    email,
    name,
    image: p.image ?? null,
    visibility: "everyone",
    discoverable: true,
    phone: null,
    inviteCode: null,
    shareCode: null,
    hideInviteCard: false,
    createdAt: Date.now(),
  };
  await db.insert(schema.users).values(u);
  return u;
}

// ---------- Google OIDC ----------

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const OAUTH_COOKIE = "dispo_oauth";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function devLoginEnabled(): boolean {
  return process.env.DEV_LOGIN === "1" && process.env.NODE_ENV !== "production";
}

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export async function beginGoogleLogin(next?: string | null): Promise<string> {
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ state, nonce, verifier, next: safeNext(next) }), {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl().startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${appUrl()}/api/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    hd: EPFL_DOMAIN,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH}?${params}`;
}

export class AuthError extends Error {}

export async function finishGoogleLogin(code: string, state: string): Promise<{ user: User; next: string | null }> {
  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete(OAUTH_COOKIE);
  if (!raw) throw new AuthError("Login expired, try again.");
  const saved = JSON.parse(raw) as { state: string; nonce: string; verifier: string; next?: string | null };
  if (saved.state !== state) throw new AuthError("State mismatch.");

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl()}/api/auth/callback`,
      grant_type: "authorization_code",
      code_verifier: saved.verifier,
    }),
  });
  if (!res.ok) throw new AuthError("Google rejected the login code.");
  const tok = (await res.json()) as { id_token?: string };
  if (!tok.id_token) throw new AuthError("No identity token from Google.");

  const { payload } = await jwtVerify(tok.id_token, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  if (payload.nonce !== saved.nonce) throw new AuthError("Nonce mismatch.");
  const email = String(payload.email ?? "");
  const verified = payload.email_verified === true;
  const hd = String(payload.hd ?? "");
  if (!verified || hd !== EPFL_DOMAIN || !isEpflEmail(email)) {
    throw new AuthError("Please sign in with your @epfl.ch Google account.");
  }
  const user = await upsertUserFromProfile({
    email,
    name: typeof payload.name === "string" ? payload.name : null,
    image: typeof payload.picture === "string" ? payload.picture : null,
  });
  return { user, next: safeNext(saved.next) };
}
