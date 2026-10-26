import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { REQUEST_COOKIE, issueCode, readRequest } from "@/lib/oauth";

/** The consent form's Allow / Cancel. Hands a code (or a refusal) back to the client. */
export async function POST(req: NextRequest) {
  // Only dispo's own form: the cookies are SameSite=Lax anyway, this refuses other sites' forms outright.
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return new Response("Forbidden", { status: 403 });
  const jar = await cookies();
  const request = await readRequest(jar.get(REQUEST_COOKIE)?.value);
  const user = await getUser();
  if (!request || !user) redirect("/oauth/consent");
  jar.delete({ name: REQUEST_COOKIE, path: "/oauth" });

  const form = await req.formData();
  const u = new URL(request.redirectUri);
  if (form.get("decision") === "allow") u.searchParams.set("code", await issueCode(user.id, request));
  else u.searchParams.set("error", "access_denied");
  if (request.state) u.searchParams.set("state", request.state);
  return Response.redirect(u, 303);
}
