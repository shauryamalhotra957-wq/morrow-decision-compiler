import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const decisionRuns = sqliteTable(
  "decision_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    question: text("question").notNull(),
    recommendation: text("recommendation", {
      enum: ["EXECUTE", "STAGE", "HOLD"],
    }).notNull(),
    confidence: real("confidence").notNull(),
    scenarioJson: text("scenario_json").notNull(),
    fingerprint: text("fingerprint").notNull().unique(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("decision_runs_created_at_idx").on(table.createdAt)],
);
