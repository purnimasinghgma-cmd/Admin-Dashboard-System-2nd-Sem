import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  role: text("role").notNull().default("admin"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SessionRow = typeof sessionTable.$inferSelect;
