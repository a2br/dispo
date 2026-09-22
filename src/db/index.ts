import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  visibility TEXT NOT NULL DEFAULT 'everyone',
  discoverable INTEGER NOT NULL DEFAULT 1,
  phone TEXT,
  invite_code TEXT,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE TABLE IF NOT EXISTS calendars (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enc_url TEXT NOT NULL,
  last_fetched_at INTEGER,
  last_ok_at INTEGER,
  last_error TEXT,
  event_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uid TEXT NOT NULL,
  start INTEGER NOT NULL,
  end INTEGER NOT NULL,
  course TEXT NOT NULL,
  kind TEXT NOT NULL,
  code TEXT,
  rooms TEXT,
  teacher TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS events_user_uid_idx ON events(user_id, uid);
CREATE INDEX IF NOT EXISTS events_user_start_idx ON events(user_id, start);
CREATE TABLE IF NOT EXISTS connections (
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS connections_addressee_idx ON connections(addressee_id);
CREATE TABLE IF NOT EXISTS saved_groups (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS saved_groups_owner_idx ON saved_groups(owner_id);
CREATE TABLE IF NOT EXISTS saved_group_members (
  group_id TEXT NOT NULL REFERENCES saved_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);
CREATE TABLE IF NOT EXISTS stars (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, target_id)
);
`;

/** Additive column migrations for databases created before the column existed. */
async function migrate(client: Client) {
  const cols = await client.execute("PRAGMA table_info(users)");
  const names = new Set(cols.rows.map((r) => String(r.name)));
  if (!names.has("discoverable")) await client.execute("ALTER TABLE users ADD COLUMN discoverable INTEGER NOT NULL DEFAULT 1");
  if (!names.has("phone")) await client.execute("ALTER TABLE users ADD COLUMN phone TEXT");
  if (!names.has("invite_code")) await client.execute("ALTER TABLE users ADD COLUMN invite_code TEXT");
  const gcols = await client.execute("PRAGMA table_info(saved_groups)");
  if (!gcols.rows.some((r) => String(r.name) === "invite_code")) await client.execute("ALTER TABLE saved_groups ADD COLUMN invite_code TEXT");
  await client.execute(
    "CREATE TABLE IF NOT EXISTS stars (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, target_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, kind, target_id))",
  );
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS users_invite_code_idx ON users(invite_code)");
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS saved_groups_invite_code_idx ON saved_groups(invite_code)");
}

type G = typeof globalThis & { __dispoDb?: ReturnType<typeof build> };

function build() {
  const url = process.env.DATABASE_URL ?? "file:./data/dispo.db";
  const client: Client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const ready: Promise<void> = client
    .executeMultiple(SCHEMA_SQL)
    .then(() => migrate(client))
    .then(() => client.execute("PRAGMA foreign_keys = ON"))
    .then(() => undefined);
  return { client, db: drizzle(client, { schema }), ready };
}

const g = globalThis as G;
const cached = g.__dispoDb;
const inst = cached ?? (g.__dispoDb = build());
// A dev-server reload reuses the cached client: still apply any new additive migrations.
if (cached) inst.ready = inst.ready.then(() => migrate(inst.client));

export const db = inst.db;
export const dbReady = inst.ready;
export { schema };
