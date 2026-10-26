import { CORS, authServerMetadata, json } from "@/lib/oauth";

export function GET() {
  return json(authServerMetadata());
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
