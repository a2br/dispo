/**
 * Local dev helper: create (or update) a user and attach a calendar link.
 *   node --env-file=.env.local --import tsx scripts/add-user.ts <email@epfl.ch> "<Full Name>" "<ics url>"
 */
import { upsertUserFromProfile } from "../src/lib/auth";
import { connectCalendar } from "../src/lib/calendar";

async function main() {
  const [email, name, url] = process.argv.slice(2);
  if (!email || !name || !url) throw new Error("usage: add-user.ts <email> <name> <ics url>");
  const u = await upsertUserFromProfile({ email, name });
  const { count } = await connectCalendar(u.id, url);
  console.log(`${u.name} <${u.email}>: ${count} sessions`);
}

main().then(() => process.exit(0));
