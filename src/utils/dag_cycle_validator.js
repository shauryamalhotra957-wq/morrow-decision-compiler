/**
 * Causal DAG Cycle Validator & Topological Sort Compiler.
 * Enforces strict directed acyclic constraints across causal inference graphs.
 */
export class CausalDagValidator {
  static validateAndSort(nodes, edges) {
    const adj = new Map();
    const inDegree = new Map();

    for (const node of nodes) {
      adj.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    for (const edge of edges) {
      if (!adj.has(edge.from) || !inDegree.has(edge.to)) {
        throw new Error(`Edge references invalid node: ${edge.from} -> ${edge.to}`);
      }
      adj.get(edge.from).push(edge.to);
      inDegree.set(edge.to, inDegree.get(edge.to) + 1);
    }

    // Kahn's algorithm
    const queue = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    const sortedOrder = [];
    while (queue.length > 0) {
      const u = queue.shift();
      sortedOrder.push(u);

      for (const v of adj.get(u)) {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    if (sortedOrder.length !== nodes.length) {
      return {
        isAcyclic: false,
        sortedOrder: [],
        error: 'Cycle detected in causal graph. Circular dependencies violate causal ordering.',
      };
    }

    return {
      isAcyclic: true,
      sortedOrder,
      error: null,
    };
  }
}
