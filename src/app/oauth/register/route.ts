import { CORS, json, oauthError, redirectAllowed, redirectHostsText, registerClient } from "@/lib/oauth";

/** RFC 7591 dynamic client registration, as claude.ai and Claude Code do it. */
export async function POST(req: Request) {
  let body: { redirect_uris?: unknown; client_name?: unknown };
  try {
    body = await req.json();
  } catch {
    return oauthError(400, "invalid_client_metadata", "Send the registration as JSON.");
  }
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  if (!uris.length || uris.length > 10 || !uris.every(redirectAllowed))
    return oauthError(400, "invalid_redirect_uri", `redirect_uris must be on ${redirectHostsText()}.`);
  const name = typeof body.client_name === "string" ? body.client_name.trim().slice(0, 60) || undefined : undefined;
  const clientId = await registerClient({ name, redirectUris: uris });
  return json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: uris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    201,
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
