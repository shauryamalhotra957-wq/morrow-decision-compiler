import assert from "node:assert/strict";
import test from "node:test";
import { rankEvidence } from "../lib/decision-engine.ts";

const records = [
  { id: "1", title: "Market growth", excerpt: "Demand is rising", source: "internal", timestamp: "2026-01-01", stance: "support", trust: 80, tags: ["growth"] },
  { id: "2", title: "Regulatory delay", excerpt: "Approval may slip", source: "regulator", timestamp: "2026-01-01", stance: "challenge", trust: 90, tags: ["regulation"] },
];

test("rankEvidence keeps result limits finite", () => {
  assert.equal(rankEvidence("growth", records, 1).length, 1);
  assert.equal(rankEvidence("growth", records, 0).length, 1);
  assert.equal(rankEvidence("growth", records, Number.NaN).length, 2);
});
