import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const documentsTable = pgTable("documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  uploadedById: text("uploaded_by_id").notNull(),
  filename: text("filename").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
