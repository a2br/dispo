/**
 * Local development seed: creates a few fake @epfl.ch users that share the ICS feed in
 * ICS_URL (yours), so search / connect / free-busy flows can be exercised.
 *
 *   node --env-file=.env.local --import tsx scripts/seed-dev.ts
 */
import { db, dbReady, schema } from "../src/db";
import { upsertUserFromProfile } from "../src/lib/auth";
import { connectCalendar } from "../src/lib/calendar";
import { and, eq } from "drizzle-orm";

const ICS = process.env.ICS_URL;
if (!ICS) throw new Error("ICS_URL missing from env");

const people = [
  { email: "lea.martin@epfl.ch", name: "Léa Martin", visibility: "connections" as const },
  { email: "noah.keller@epfl.ch", name: "Noah Keller", visibility: "everyone" as const },
  { email: "sofia.rossi@epfl.ch", name: "Sofia Rossi", visibility: "private" as const },
  { email: "tim.weber@epfl.ch", name: "Tim Weber", visibility: "connections" as const, noCalendar: true },
];

async function main() {
  await dbReady;
  const me = (await db.select().from(schema.users).where(eq(schema.users.email, "anatole.debierre@epfl.ch")))[0];
  for (const p of people) {
    const u = await upsertUserFromProfile({ email: p.email, name: p.name, locale: "en" });
    await db.update(schema.users).set({ visibility: p.visibility }).where(eq(schema.users.id, u.id));
    if (!p.noCalendar) {
      const { count } = await connectCalendar(u.id, ICS!);
      console.log(`${p.name}: ${count} sessions`);
    } else console.log(`${p.name}: no calendar`);
  }
  if (me) {
    const lea = (await db.select().from(schema.users).where(eq(schema.users.email, "lea.martin@epfl.ch")))[0];
    const exists = await db
      .select()
      .from(schema.connections)
      .where(and(eq(schema.connections.requesterId, lea.id), eq(schema.connections.addresseeId, me.id)));
    if (!exists.length) {
      await db.insert(schema.connections).values({ requesterId: lea.id, addresseeId: me.id, status: "pending", createdAt: Date.now() });
      console.log("Léa → you: pending request");
    }
  }
}

main().then(() => process.exit(0));
