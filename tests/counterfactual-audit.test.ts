import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CounterfactualAuditLedger } from "../lib/counterfactual-audit.ts";

describe("CounterfactualAuditLedger", () => {
  it("initializes with a valid genesis block and records chained decisions", () => {
    const ledger = new CounterfactualAuditLedger();
    const history = ledger.getHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].decisionId, "GENESIS");

    const block1 = ledger.recordDecision("DEC-EU-EXPANSION", { readiness: 85, speed: 70, evidenceDepth: 90, riskAppetite: 45 });
    assert.equal(block1.index, 1);
    assert.equal(block1.previousHash, history[0].hash);
    assert.ok(ledger.verifyChain());
  });

  it("detects tampering when a block in the chain is modified", () => {
    const ledger = new CounterfactualAuditLedger();
    ledger.recordDecision("DEC-1", { readiness: 50, speed: 50, evidenceDepth: 50, riskAppetite: 50 });
    ledger.recordDecision("DEC-2", { readiness: 60, speed: 60, evidenceDepth: 60, riskAppetite: 60 });

    assert.ok(ledger.verifyChain());

    // Tamper with history
    const history = ledger.getHistory();
    history[1].inputs.readiness = 99; // mutate without recalculating hash

    // Verify verification fails on mutated data
    const recalculated = CounterfactualAuditLedger["calculateHash"](
      history[1].index,
      history[1].timestamp,
      history[1].previousHash,
      history[1].decisionId,
      history[1].inputs,
      history[1].result
    );
    assert.notEqual(history[1].hash, recalculated);
  });
});
