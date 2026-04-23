import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const activityTable = pgTable("activity", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  actorId: text("actor_id").notNull(),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
