import { CORS, json, resourceMetadata } from "@/lib/oauth";

export function GET() {
  return json(resourceMetadata());
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
