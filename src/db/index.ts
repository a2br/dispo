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
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS saved_groups_owner_idx ON saved_groups(owner_id);
CREATE TABLE IF NOT EXISTS saved_group_members (
  group_id TEXT NOT NULL REFERENCES saved_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);
`;

type G = typeof globalThis & { __dispoDb?: ReturnType<typeof build> };

function build() {
  const url = process.env.DATABASE_URL ?? "file:./data/dispo.db";
  const client: Client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const ready = client.executeMultiple(SCHEMA_SQL).then(() => client.execute("PRAGMA foreign_keys = ON"));
  return { client, db: drizzle(client, { schema }), ready };
}

const g = globalThis as G;
const inst = g.__dispoDb ?? (g.__dispoDb = build());

export const db = inst.db;
export const dbReady = inst.ready;
export { schema };
