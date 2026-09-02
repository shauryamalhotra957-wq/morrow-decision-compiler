import { createHash } from "node:crypto";
import { simulateDecision, type SimulationInputs, type SimulationResult } from "./decision-engine.ts";

export interface DecisionBlock {
  index: number;
  timestamp: string;
  previousHash: string;
  decisionId: string;
  inputs: SimulationInputs;
  result: SimulationResult;
  hash: string;
}

export class CounterfactualAuditLedger {
  private chain: DecisionBlock[] = [];

  constructor() {
    this.createGenesisBlock();
  }

  private static calculateHash(
    index: number,
    timestamp: string,
    previousHash: string,
    decisionId: string,
    inputs: SimulationInputs,
    result: SimulationResult
  ): string {
    const payload = JSON.stringify({ index, timestamp, previousHash, decisionId, inputs, result });
    return createHash("sha256").update(payload).digest("hex");
  }

  private createGenesisBlock() {
    const genesisInputs: SimulationInputs = { readiness: 75, speed: 60, evidenceDepth: 80, riskAppetite: 50 };
    const genesisResult: SimulationResult = simulateDecision(genesisInputs, 2049, 500);
    const timestamp = "2026-01-01T00:00:00.000Z";
    const hash = CounterfactualAuditLedger.calculateHash(0, timestamp, "0".repeat(64), "GENESIS", genesisInputs, genesisResult);

    this.chain.push({
      index: 0,
      timestamp,
      previousHash: "0".repeat(64),
      decisionId: "GENESIS",
      inputs: genesisInputs,
      result: genesisResult,
      hash,
    });
  }

  public recordDecision(decisionId: string, inputs: SimulationInputs, seed = 2049, runs = 1000): DecisionBlock {
    const previousBlock = this.chain[this.chain.length - 1];
    const index = previousBlock.index + 1;
    const timestamp = new Date().toISOString();
    const result = simulateDecision(inputs, seed, runs);
    const hash = CounterfactualAuditLedger.calculateHash(
      index,
      timestamp,
      previousBlock.hash,
      decisionId,
      inputs,
      result
    );

    const block: DecisionBlock = {
      index,
      timestamp,
      previousHash: previousBlock.hash,
      decisionId,
      inputs,
      result,
      hash,
    };

    this.chain.push(block);
    return block;
  }

  public verifyChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return false;
      }

      const recalculatedHash = CounterfactualAuditLedger.calculateHash(
        current.index,
        current.timestamp,
        current.previousHash,
        current.decisionId,
        current.inputs,
        current.result
      );

      if (current.hash !== recalculatedHash) {
        return false;
      }
    }
    return true;
  }

  public getHistory(): DecisionBlock[] {
    return [...this.chain];
  }
}
