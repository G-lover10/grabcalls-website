import test from "node:test";
import assert from "node:assert/strict";
import { originAllowed, summarizeItems, buildMessages } from "./mc-preview.mjs";

test("origin allowlist", () => {
  assert.equal(originAllowed("https://grabcalls.com"), true);
  assert.equal(originAllowed("https://www.grabcalls.com"), true);
  assert.equal(originAllowed("http://127.0.0.1:8080"), true);
  assert.equal(originAllowed("https://preview.grok-sandbox.com"), true);
  assert.equal(originAllowed("https://evil.example"), false);
  assert.equal(originAllowed("https://grabcalls.com.evil.example"), false);
  assert.equal(originAllowed("not a url"), false);
  assert.equal(originAllowed(""), true);
});

test("item summary includes a real title", () => {
  const summary = summarizeItems({
    items: [{ type: "project", status: "active", title: "ListSnap", next_step: "Check the eBay token", last_updated: "2026-07-16" }],
  });
  assert.match(summary, /ListSnap/);
  assert.match(summary, /eBay/);
  const messages = buildMessages(summary, "next step?", []);
  assert.equal(messages[0].role, "system");
  assert.match(messages[0].content, /ListSnap/);
  assert.equal(messages.at(-1).content, "next step?");
});

