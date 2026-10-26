import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { mcpServer } from "@/lib/mcp";
import { CORS, resourceMetadataUrl, userForAccessToken } from "@/lib/oauth";

/**
 * MCP over Streamable HTTP, stateless: each request gets its own server, bound to the person
 * behind the bearer token. Without a valid token, the 401 points the client at the sign-in.
 */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const user = token ? await userForAccessToken(token) : null;
  if (!user) {
    const challenge = `Bearer resource_metadata="${resourceMetadataUrl()}"${token ? ', error="invalid_token"' : ""}`;
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32001, message: "Sign in to dispo first." }, id: null },
      { status: 401, headers: { ...CORS, "WWW-Authenticate": challenge } },
    );
  }
  const server = mcpServer(user);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    const res = await transport.handleRequest(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
    return new Response(await res.text(), { status: res.status, headers });
  } finally {
    await server.close();
  }
}

/** No server-to-client stream in stateless mode. */
function notAllowed() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null },
    { status: 405, headers: { ...CORS, Allow: "POST" } },
  );
}

export const GET = notAllowed;
export const DELETE = notAllowed;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
