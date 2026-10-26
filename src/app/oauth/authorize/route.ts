import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { appUrl } from "@/lib/auth";
import { REQUEST_COOKIE, SCOPE, readClient, signRequest } from "@/lib/oauth";

/**
 * Start of an MCP client's sign-in. The checked request waits in a short-lived cookie while the
 * person signs in (Google's round trip only carries a short `next`) and decides on /oauth/consent.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const clientId = p.get("client_id");
  const client = await readClient(clientId);
  if (!clientId || !client) return new Response("Unknown client. Start connecting again from Claude.", { status: 400 });
  const redirectUri = p.get("redirect_uri") ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : null);
  if (!redirectUri || !client.redirectUris.includes(redirectUri)) return new Response("redirect_uri doesn't match this client.", { status: 400 });

  // The redirect URI is known good: from here on, errors go back to the client (RFC 6749 §4.1.2.1).
  const state = p.get("state") ?? undefined;
  const back = (error: string, description: string) => {
    const u = new URL(redirectUri);
    u.searchParams.set("error", error);
    u.searchParams.set("error_description", description);
    if (state) u.searchParams.set("state", state);
    return Response.redirect(u, 303);
  };
  if (p.get("response_type") !== "code") return back("unsupported_response_type", "Only response_type=code is supported.");
  const codeChallenge = p.get("code_challenge");
  if (!codeChallenge || p.get("code_challenge_method") !== "S256") return back("invalid_request", "PKCE with S256 is required.");

  // One read-only scope, whatever was asked for.
  const request = await signRequest({ clientId, clientName: client.name, redirectUri, codeChallenge, state, scope: SCOPE });
  (await cookies()).set(REQUEST_COOKIE, request, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl().startsWith("https://"),
    path: "/oauth",
    maxAge: 900,
  });
  redirect("/oauth/consent");
}
