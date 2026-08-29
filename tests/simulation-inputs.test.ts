import assert from "node:assert/strict";
import test from "node:test";
import { normalizedInput, simulateDecision } from "../lib/decision-engine.ts";

test("simulation controls normalize to finite domain values", () => {
  assert.equal(normalizedInput(120), 1);
  assert.equal(normalizedInput(-10), 0);
  assert.equal(normalizedInput(Number.NaN), 0.5);
  assert.equal(normalizedInput(Infinity), 0.5);

  const result = simulateDecision(
    { readiness: Number.NaN, speed: Infinity, evidenceDepth: -20, riskAppetite: 50 },
    42,
    100,
  );
  for (const value of [result.successProbability, result.expectedValue, result.downside, result.confidence]) {
    assert.ok(Number.isFinite(value));
  }
});
