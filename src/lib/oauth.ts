import { createHash } from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { User } from "@/db/schema";
import { appUrl } from "./auth";
import { getUserById } from "./calendar";

/**
 * OAuth 2.1 for MCP clients (claude.ai, the Claude apps, Claude Code), so Claude can read dispo as
 * the person who connects it. Stateless like the session cookie: client ids, pending requests,
 * codes and tokens are signed JWTs, nothing is stored, and rotating AUTH_SECRET signs every client
 * out. They're signed with a key derived from AUTH_SECRET, so none of them passes as a session
 * cookie (or the reverse). Approving a client = being signed in to dispo and clicking Allow on
 * /oauth/consent.
 */

const ACCESS_TTL = 3600; // seconds
const REFRESH_TTL = 30 * 86400; // each refresh starts a new 30 days, like signing in again
const CODE_TTL = 300;
const REQUEST_TTL = 900;

export const SCOPE = "schedule";
/** The authorization request waiting on /oauth/consent while the person signs in and decides. */
export const REQUEST_COOKIE = "dispo_mcp_request";

/** Hosts a client may hand sign-ins back to, besides loopback (Claude Code). */
const REDIRECT_HOSTS = (process.env.MCP_REDIRECT_HOSTS || "claude.ai,claude.com")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

type Kind = "client" | "request" | "code" | "access" | "refresh";

function key(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET missing or too short");
  return createHash("sha256").update(`dispo mcp oauth\0${s}`).digest();
}

async function sign(kind: Kind, claims: JWTPayload, ttl?: number): Promise<string> {
  const jwt = new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setAudience(`mcp:${kind}`).setIssuedAt();
  if (ttl) jwt.setExpirationTime(Math.floor(Date.now() / 1000) + ttl);
  return jwt.sign(key());
}

async function read<T>(kind: Kind, token: string | null | undefined): Promise<(T & JWTPayload) | null> {
  if (!token) return null;
  try {
    return (await jwtVerify(token, key(), { algorithms: ["HS256"], audience: `mcp:${kind}` })).payload as T & JWTPayload;
  } catch {
    return null;
  }
}

export function mcpUrl(): string {
  return `${appUrl()}/mcp`;
}

export function resourceMetadataUrl(): string {
  return `${appUrl()}/.well-known/oauth-protected-resource/mcp`;
}

/** RFC 9728: where /mcp sends clients to sign in. */
export function resourceMetadata() {
  return { resource: mcpUrl(), authorization_servers: [appUrl()], scopes_supported: [SCOPE], bearer_methods_supported: ["header"], resource_name: "dispo" };
}

/** RFC 8414. */
export function authServerMetadata() {
  const base = appUrl();
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE],
  };
}

/** Bearer-token endpoints answer any origin: no cookies are involved. */
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
};

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store" } });
}

export function oauthError(status: number, error: string, description: string): Response {
  return json({ error, error_description: description }, status);
}

// ---------- clients (RFC 7591 dynamic registration) ----------

export type Client = { name?: string; redirectUris: string[] };

/** Sign-ins only go back to Claude's own sites, or to this machine (Claude Code). */
export function redirectAllowed(uri: string): boolean {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.hash) return false;
  if (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)) return true;
  return u.protocol === "https:" && REDIRECT_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
}

export function redirectHostsText(): string {
  return `${REDIRECT_HOSTS.join(", ")} or localhost`;
}

/** The client id is the signed registration itself. */
export async function registerClient(c: Client): Promise<string> {
  return sign("client", { name: c.name, uris: c.redirectUris });
}

export async function readClient(clientId: string | null | undefined): Promise<Client | null> {
  const c = await read<{ name?: string; uris?: string[] }>("client", clientId);
  return c && Array.isArray(c.uris) ? { name: c.name, redirectUris: c.uris } : null;
}

// ---------- authorization ----------

export type AuthRequest = { clientId: string; clientName?: string; redirectUri: string; codeChallenge: string; state?: string; scope: string };

export async function signRequest(r: AuthRequest): Promise<string> {
  return sign("request", r, REQUEST_TTL);
}

export async function readRequest(token: string | null | undefined): Promise<AuthRequest | null> {
  return read<AuthRequest>("request", token);
}

export async function issueCode(userId: string, r: AuthRequest): Promise<string> {
  return sign("code", { sub: userId, clientId: r.clientId, redirectUri: r.redirectUri, codeChallenge: r.codeChallenge, scope: r.scope }, CODE_TTL);
}

// ---------- tokens ----------

type Grant = { clientId: string; scope: string };

async function issueTokens(userId: string, g: Grant) {
  const claims = { sub: userId, clientId: g.clientId, scope: g.scope };
  return {
    access_token: await sign("access", claims, ACCESS_TTL),
    token_type: "Bearer",
    expires_in: ACCESS_TTL,
    refresh_token: await sign("refresh", claims, REFRESH_TTL),
    scope: g.scope,
  };
}

function pkceMatches(verifier: string, challenge: string): boolean {
  return /^[A-Za-z0-9\-._~]{43,128}$/.test(verifier) && createHash("sha256").update(verifier).digest("base64url") === challenge;
}

/** The token endpoint's grants. Answers the token response, or an RFC 6749 error. */
export async function exchange(clientId: string, p: (k: string) => string | null): Promise<Response> {
  const grant = p("grant_type");
  if (grant === "authorization_code") {
    const c = await read<Grant & { redirectUri: string; codeChallenge: string }>("code", p("code"));
    if (!c?.sub || c.clientId !== clientId) return oauthError(400, "invalid_grant", "Invalid or expired code.");
    if (p("redirect_uri") && p("redirect_uri") !== c.redirectUri) return oauthError(400, "invalid_grant", "redirect_uri doesn't match.");
    if (!pkceMatches(p("code_verifier") ?? "", c.codeChallenge)) return oauthError(400, "invalid_grant", "PKCE verification failed.");
    if (!(await getUserById(c.sub))) return oauthError(400, "invalid_grant", "This account no longer exists.");
    return json(await issueTokens(c.sub, c));
  }
  if (grant === "refresh_token") {
    const r = await read<Grant>("refresh", p("refresh_token"));
    if (!r?.sub || r.clientId !== clientId) return oauthError(400, "invalid_grant", "Invalid or expired refresh token.");
    if (!(await getUserById(r.sub))) return oauthError(400, "invalid_grant", "This account no longer exists.");
    return json(await issueTokens(r.sub, r));
  }
  return oauthError(400, "unsupported_grant_type", "Use authorization_code or refresh_token.");
}

/** The person behind a bearer token, or null. */
export async function userForAccessToken(token: string): Promise<User | null> {
  const a = await read<Grant>("access", token);
  return a?.sub ? getUserById(a.sub) : null;
}
