export type SimulationInputs = {
  readiness: number;
  speed: number;
  evidenceDepth: number;
  riskAppetite: number;
};

export type EvidenceRecord = {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  timestamp: string;
  stance: "support" | "challenge" | "neutral";
  trust: number;
  tags: string[];
};

export type RankedEvidence = EvidenceRecord & {
  relevance: number;
};

export type SimulationResult = {
  successProbability: number;
  expectedValue: number;
  downside: number;
  confidence: number;
  recommendation: "EXECUTE" | "STAGE" | "HOLD";
  spread: { pessimistic: number; expected: number; optimistic: number };
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
]);

export function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function termFrequency(tokens: string[]) {
  const frequencies = new Map<string, number>();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  return frequencies;
}

export function rankEvidence(
  query: string,
  records: EvidenceRecord[],
  limit = 4,
): RankedEvidence[] {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) {
    return records
      .slice()
      .sort((a, b) => b.trust - a.trust)
      .slice(0, limit)
      .map((record) => ({ ...record, relevance: record.trust }));
  }

  const tokenizedRecords = records.map((record) =>
    tokenize(`${record.title} ${record.excerpt} ${record.tags.join(" ")}`),
  );
  const documentFrequency = new Map<string, number>();
  for (const tokens of tokenizedRecords) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const queryFrequency = termFrequency(queryTokens);
  const scored = records.map((record, index) => {
    const recordFrequency = termFrequency(tokenizedRecords[index]);
    let semanticScore = 0;
    for (const [token, queryCount] of queryFrequency) {
      const recordCount = recordFrequency.get(token) ?? 0;
      if (!recordCount) continue;
      const inverseDocumentFrequency = Math.log(
        (records.length + 1) / ((documentFrequency.get(token) ?? 0) + 1),
      ) + 1;
      semanticScore +=
        (1 + Math.log(recordCount)) *
        (1 + Math.log(queryCount)) *
        inverseDocumentFrequency ** 2;
    }

    const stanceBonus = record.stance === "challenge" ? 0.06 : 0;
    const relevance = Math.min(
      0.99,
      semanticScore / Math.max(queryTokens.length * 3.2, 1) +
        (record.trust / 100) * 0.22 +
        stanceBonus,
    );
    return { ...record, relevance: Math.round(relevance * 100) };
  });

  return scored
    .sort((a, b) => b.relevance - a.relevance || b.trust - a.trust)
    .slice(0, limit);
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(random: () => number) {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function percentile(values: number[], point: number) {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(point * sorted.length));
  return sorted[index];
}

export function simulateDecision(
  inputs: SimulationInputs,
  seed = 2049,
  iterations = 2400,
): SimulationResult {
  const normalized = {
    readiness: inputs.readiness / 100,
    speed: inputs.speed / 100,
    evidenceDepth: inputs.evidenceDepth / 100,
    riskAppetite: inputs.riskAppetite / 100,
  };
  const random = mulberry32(seed);
  const outcomes: number[] = [];
  let successCount = 0;

  for (let index = 0; index < iterations; index += 1) {
    const demandShock = normal(random) * (0.23 - normalized.evidenceDepth * 0.1);
    const executionShock = normal(random) * (0.2 - normalized.readiness * 0.08);
    const timingEdge = normalized.speed * 0.45 - normalized.speed ** 2 * 0.22;
    const execution = normalized.readiness * 0.58 + executionShock;
    const signal =
      execution +
      timingEdge +
      normalized.evidenceDepth * 0.34 +
      demandShock -
      0.61;
    const probability = 1 / (1 + Math.exp(-signal * 4.1));
    const success = random() < probability;
    if (success) successCount += 1;

    const upside = 18 + normalized.speed * 11 + normalized.readiness * 8;
    const failureCost =
      9 + normalized.speed * 8 - normalized.evidenceDepth * 3.5;
    const outcome = success
      ? upside * (0.78 + random() * 0.5)
      : -failureCost * (0.7 + random() * 0.7);
    outcomes.push(outcome);
  }

  const successProbability = Math.round((successCount / iterations) * 100);
  const expectedValue =
    outcomes.reduce((total, outcome) => total + outcome, 0) / outcomes.length;
  const downside = Math.abs(percentile(outcomes, 0.1));
  const confidence = Math.round(
    52 + normalized.evidenceDepth * 27 + normalized.readiness * 13,
  );
  const riskAdjustedThreshold = 62 - normalized.riskAppetite * 12;
  const recommendation =
    successProbability >= riskAdjustedThreshold + 9
      ? "EXECUTE"
      : successProbability >= riskAdjustedThreshold - 5
        ? "STAGE"
        : "HOLD";

  return {
    successProbability,
    expectedValue: Number(expectedValue.toFixed(1)),
    downside: Number(downside.toFixed(1)),
    confidence: Math.min(confidence, 96),
    recommendation,
    spread: {
      pessimistic: Number(percentile(outcomes, 0.1).toFixed(1)),
      expected: Number(percentile(outcomes, 0.5).toFixed(1)),
      optimistic: Number(percentile(outcomes, 0.9).toFixed(1)),
    },
  };
}

export function stableScenarioSeed(inputs: SimulationInputs) {
  return (
    inputs.readiness * 73856093 ^
    inputs.speed * 19349663 ^
    inputs.evidenceDepth * 83492791 ^
    inputs.riskAppetite * 2971215073
  ) >>> 0;
}
