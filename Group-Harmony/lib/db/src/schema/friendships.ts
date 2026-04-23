import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const friendshipsTable = pgTable(
  "friendships",
  {
    userId: text("user_id").notNull(),
    friendId: text("friend_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.friendId] })],
);
