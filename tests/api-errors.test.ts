import assert from "node:assert/strict";
import test from "node:test";
import { errorResponse } from "../app/api/decisions/route";

test("decision API exposes stable public errors", async () => {
  const response = errorResponse("Unable to seal decision");
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Unable to seal decision" });
});
