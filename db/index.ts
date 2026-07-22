import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getD1() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export async function ensureDecisionSchema() {
  const d1 = getD1();
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS decision_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      question TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      confidence REAL NOT NULL,
      scenario_json TEXT NOT NULL,
      fingerprint TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS decision_runs_created_at_idx ON decision_runs (created_at)",
    ),
  ]);
}
