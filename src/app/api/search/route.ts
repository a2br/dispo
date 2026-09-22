import { inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db, dbReady, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { searchUsers, statusesFor } from "@/lib/calendar";
import { searchDirectory } from "@/lib/directory";
import { publicPerson } from "@/lib/present";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const includeDirectory = req.nextUrl.searchParams.get("directory") !== "0";
  if (q.trim().length < 2) return Response.json({ people: [], directory: [] });

  const [found, dir] = await Promise.all([searchUsers(user, q), includeDirectory ? searchDirectory(q) : Promise.resolve([])]);
  const statuses = await statusesFor(found.map((u) => u.id));

  // Hide directory entries for anyone already on the app, except private profiles:
  // treating those as "not on the app" is what keeps their membership hidden.
  await dbReady;
  const emails = dir.map((d) => d.email);
  const registered = emails.length
    ? await db.select({ email: schema.users.email, visibility: schema.users.visibility }).from(schema.users).where(inArray(schema.users.email, emails))
    : [];
  const skip = new Set([user.email, ...registered.filter((r) => r.visibility !== "private").map((r) => r.email)]);

  return Response.json({
    people: found.map((u) => publicPerson(u, statuses.get(u.id) ?? { state: "unknown" })),
    directory: dir.filter((d) => !skip.has(d.email)),
  });
}
