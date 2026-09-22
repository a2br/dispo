import { redirect } from "next/navigation";
import { beginGoogleLogin, googleConfigured } from "@/lib/auth";

export async function GET() {
  if (!googleConfigured()) redirect("/?error=" + encodeURIComponent("Google sign-in isn't configured on this server yet."));
  redirect(await beginGoogleLogin());
}
