import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Morrow decision workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Morrow — Strategic certainty, compiled<\/title>/i);
  assert.match(html, /Should we launch Atlas Mesh/);
  assert.match(html, /COUNTERFACTUAL LAB/);
  assert.match(html, /EVIDENCE LEDGER/);
  assert.match(html, /RED TEAM INTERCEPT/);
  assert.match(html, /Seal decision/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships product-specific social metadata", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /property="og:title" content="Morrow — Interrogate the future"/i);
  assert.match(html, /property="og:image" content="https:\/\/morrow\.systems\/og\.png"/i);
  assert.match(html, /name="twitter:card" content="summary_large_image"/i);
});
