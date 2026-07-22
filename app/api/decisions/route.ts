import { desc, eq } from "drizzle-orm";
import { decisionRuns } from "@/db/schema";
import { ensureDecisionSchema, getDb } from "@/db";

type DecisionPayload = {
  title?: unknown;
  question?: unknown;
  recommendation?: unknown;
  confidence?: unknown;
  scenario?: unknown;
};

const allowedRecommendations = new Set(["EXECUTE", "STAGE", "HOLD"]);

function textValue(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function fingerprint(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET() {
  try {
    await ensureDecisionSchema();
    const rows = await getDb()
      .select({
        id: decisionRuns.id,
        title: decisionRuns.title,
        question: decisionRuns.question,
        recommendation: decisionRuns.recommendation,
        confidence: decisionRuns.confidence,
        createdAt: decisionRuns.createdAt,
      })
      .from(decisionRuns)
      .orderBy(desc(decisionRuns.createdAt), desc(decisionRuns.id))
      .limit(20);
    return Response.json({ decisions: rows });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to read ledger" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DecisionPayload;
    const title = textValue(payload.title, 140);
    const question = textValue(payload.question, 400);
    const recommendation = textValue(payload.recommendation, 12);
    const confidence = Number(payload.confidence);

    if (!title || !question) {
      return Response.json({ error: "title and question are required" }, { status: 400 });
    }
    if (!allowedRecommendations.has(recommendation)) {
      return Response.json({ error: "invalid recommendation" }, { status: 400 });
    }
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
      return Response.json({ error: "confidence must be between 0 and 100" }, { status: 400 });
    }

    const scenarioJson = JSON.stringify(payload.scenario ?? {});
    if (scenarioJson.length > 50_000) {
      return Response.json({ error: "scenario exceeds 50KB" }, { status: 413 });
    }
    const decisionFingerprint = await fingerprint(
      `${question}|${recommendation}|${confidence}|${scenarioJson}`,
    );

    await ensureDecisionSchema();
    const db = getDb();
    const existing = await db
      .select()
      .from(decisionRuns)
      .where(eq(decisionRuns.fingerprint, decisionFingerprint))
      .limit(1);
    if (existing[0]) {
      return Response.json({ decision: existing[0], deduplicated: true });
    }

    const [decision] = await db
      .insert(decisionRuns)
      .values({
        title,
        question,
        recommendation: recommendation as "EXECUTE" | "STAGE" | "HOLD",
        confidence,
        scenarioJson,
        fingerprint: decisionFingerprint,
      })
      .returning();
    return Response.json({ decision }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to seal decision" },
      { status: 500 },
    );
  }
}
