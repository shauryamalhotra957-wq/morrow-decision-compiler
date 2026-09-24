import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CausalDagValidator } from '../src/utils/dag_cycle_validator.js';

describe('CausalDagValidator Test Suite', () => {
  test('validates and topologically sorts acyclic DAG', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges = [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
    ];
    const res = CausalDagValidator.validateAndSort(nodes, edges);
    assert.strictEqual(res.isAcyclic, true);
    assert.deepStrictEqual(res.sortedOrder, ['A', 'B', 'C']);
  });

  test('flags circular reference cycle in graph', () => {
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges = [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'A' }, // Circular cycle
    ];
    const res = CausalDagValidator.validateAndSort(nodes, edges);
    assert.strictEqual(res.isAcyclic, false);
    assert.ok(res.error.includes('Cycle detected'));
  });
});
