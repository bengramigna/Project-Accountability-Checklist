import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  authorId: text("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
