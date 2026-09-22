import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export type Visibility = "everyone" | "connections" | "private";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    image: text("image"),
    visibility: text("visibility").$type<Visibility>().notNull().default("everyone"),
    /** Opted in to Discover: appears to people who share courses, and sees them. */
    discoverable: integer("discoverable", { mode: "boolean" }).notNull().default(true),
    /** Optional, shown to classmates in Discover and to connections so they can reach you. */
    phone: text("phone"),
    /** Personal invite link code: /i/<code>. Created on first use. */
    inviteCode: text("invite_code"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const calendars = sqliteTable("calendars", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  encUrl: text("enc_url").notNull(),
  lastFetchedAt: integer("last_fetched_at"),
  lastOkAt: integer("last_ok_at"),
  lastError: text("last_error"),
  eventCount: integer("event_count").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export type EventKind = "lecture" | "exercise" | "lab" | "project" | "other";

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    uid: text("uid").notNull(),
    start: integer("start").notNull(), // epoch ms
    end: integer("end").notNull(),
    course: text("course").notNull(),
    kind: text("kind").$type<EventKind>().notNull(),
    code: text("code"),
    rooms: text("rooms"),
    teacher: text("teacher"),
  },
  (t) => [uniqueIndex("events_user_uid_idx").on(t.userId, t.uid), index("events_user_start_idx").on(t.userId, t.start)],
);

export type ConnectionStatus = "pending" | "accepted";

export const connections = sqliteTable(
  "connections",
  {
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<ConnectionStatus>().notNull().default("pending"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.requesterId, t.addresseeId] }), index("connections_addressee_idx").on(t.addresseeId)],
);

/** Saved groups of people, private to their owner, for one-tap "find a time". */
export const savedGroups = sqliteTable(
  "saved_groups",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Set when the group has a share link (/g/<code>): members then see the group too. */
    inviteCode: text("invite_code"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("saved_groups_owner_idx").on(t.ownerId)],
);

export const savedGroupMembers = sqliteTable(
  "saved_group_members",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => savedGroups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] })],
);

/** Quick-access favourites: starred people and groups appear as chips in the calendar. */
export const stars = sqliteTable(
  "stars",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"user" | "group">().notNull(),
    targetId: text("target_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind, t.targetId] })],
);

export type User = typeof users.$inferSelect;
export type SavedGroup = typeof savedGroups.$inferSelect;
export type Calendar = typeof calendars.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Connection = typeof connections.$inferSelect;
