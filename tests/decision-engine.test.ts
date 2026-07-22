import assert from "node:assert/strict";
import test from "node:test";
import {
  rankEvidence,
  simulateDecision,
  stableScenarioSeed,
  tokenize,
  type EvidenceRecord,
} from "../lib/decision-engine.ts";

const corpus: EvidenceRecord[] = [
  {
    id: "1",
    title: "Regulatory launch risk",
    excerpt: "Compliance review creates launch timing uncertainty.",
    source: "Legal",
    timestamp: "today",
    stance: "challenge",
    trust: 96,
    tags: ["compliance", "risk"],
  },
  {
    id: "2",
    title: "Customer demand",
    excerpt: "Buyers accept premium pricing for auditability.",
    source: "Research",
    timestamp: "today",
    stance: "support",
    trust: 88,
    tags: ["demand", "pricing"],
  },
];

test("tokenizer normalizes punctuation and stop words", () => {
  assert.deepEqual(tokenize("The compliance-risk, for DACH!"), [
    "compliance-risk",
    "dach",
  ]);
});

test("retrieval ranks semantically matching evidence first", () => {
  const ranked = rankEvidence("compliance regulation launch risk", corpus, 2);
  assert.equal(ranked[0].id, "1");
  assert.ok(ranked[0].relevance > ranked[1].relevance);
});

test("retrieval falls back to source trust for an empty query", () => {
  const ranked = rankEvidence("", corpus, 2);
  assert.equal(ranked[0].trust, 96);
});

test("simulation is deterministic for a fixed scenario", () => {
  const inputs = {
    readiness: 78,
    speed: 68,
    evidenceDepth: 83,
    riskAppetite: 57,
  };
  const seed = stableScenarioSeed(inputs);
  assert.deepEqual(
    simulateDecision(inputs, seed, 600),
    simulateDecision(inputs, seed, 600),
  );
});

test("stronger evidence and readiness improve confidence", () => {
  const weak = simulateDecision(
    { readiness: 30, speed: 70, evidenceDepth: 25, riskAppetite: 50 },
    42,
    1200,
  );
  const strong = simulateDecision(
    { readiness: 90, speed: 70, evidenceDepth: 95, riskAppetite: 50 },
    42,
    1200,
  );
  assert.ok(strong.confidence > weak.confidence);
  assert.ok(strong.successProbability > weak.successProbability);
});
