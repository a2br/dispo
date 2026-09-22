import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { beginGoogleLogin, googleConfigured } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!googleConfigured()) redirect("/?error=" + encodeURIComponent("Google sign-in isn't configured on this server yet."));
  redirect(await beginGoogleLogin(req.nextUrl.searchParams.get("next")));
}
