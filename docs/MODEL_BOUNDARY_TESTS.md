# Model boundary tests

The decision compiler keeps model behavior deterministic and bounded at its API edge.

- Decision ledger errors return stable public messages and do not expose runtime/database details.
- Evidence result limits are clamped to a finite range.
- Non-finite simulation controls fall back to documented baselines before modeling.
- Fixed seeds produce reproducible simulation output; tests should assert finiteness for every returned metric.
- Changes to normalization or scoring require a unit regression plus a rendered-product check.

Run npm run test:unit for engine and boundary tests, then npm test for the production build and rendered contract.
