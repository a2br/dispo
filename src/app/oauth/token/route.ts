import { CORS, exchange, oauthError, readClient } from "@/lib/oauth";

/** Public clients only: the client id comes in the body (or as the user of HTTP Basic), PKCE proves the rest. */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return oauthError(400, "invalid_request", "Send the parameters form-encoded.");
  }
  const p = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : null;
  };
  const clientId = p("client_id") ?? basicUser(req.headers.get("authorization"));
  if (!clientId || !(await readClient(clientId))) return oauthError(401, "invalid_client", "Unknown client. Connect again from Claude.");
  return exchange(clientId, p);
}

function basicUser(header: string | null): string | null {
  const b64 = header?.match(/^Basic\s+(.+)$/i)?.[1];
  if (!b64) return null;
  const user = Buffer.from(b64, "base64").toString("utf8").split(":")[0];
  return user ? decodeURIComponent(user) : null;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
