import type { NextRequest } from "next/server";
import { refreshAllStale } from "@/lib/calendar";

/** Called by the platform cron (see vercel.json) or any scheduler: Authorization: Bearer $CRON_SECRET */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const result = await refreshAllStale();
  return Response.json(result);
}
