# Contributing to Morrow

## Development contract

1. Create a focused branch.
2. Keep retrieval and simulation behavior deterministic.
3. Add or update a test for every behavioral change.
4. Run `npm test` and `npm run lint` before opening a pull request.
5. Explain any model or scoring change in the pull request, including its expected directional effect.

## Product constraints

- Never let generated prose become evidence.
- Never hide a contradictory source to improve confidence.
- Never introduce a random path without a caller-supplied or recorded seed.
- Never store secrets, customer data, or local runtime state in the repository.
- Keep the no-key local demo fully functional.

## Commit style

Use short, imperative messages such as `Add scenario comparison` or `Calibrate retrieval trust weight`.
