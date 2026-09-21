import { strict as assert } from "node:assert";
import test from "node:test";
import { adsTxt, validateAdConfiguration, type AdConfiguration } from "../src/site/ad-configuration";
import { adSlotDecision } from "../src/site/ads";

const configuration: AdConfiguration = {
  state: "pending-review",
  publisherId: "ca-pub-1234567890123456",
  cmpReady: false,
  slots: { articleBody: "1234567890" },
};

test("review exports the seller record without requiring a CMP or requesting ads", () => {
  assert.doesNotThrow(() => validateAdConfiguration(configuration));
  assert.equal(adsTxt(configuration), "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  assert.equal(adSlotDecision("article-body", "/blog/guide/", configuration).request, false);
});

test("build validation refuses live ads without a published CMP or valid identifiers", () => {
  for (const change of [
    { cmpReady: false },
    { publisherId: "ca-pub-placeholder" },
    { slots: { articleBody: "" } },
    { slots: { articleBody: "12345" } },
    { state: "livve" as AdConfiguration["state"] },
  ]) {
    assert.throws(() => validateAdConfiguration({ ...configuration, state: "live", cmpReady: true, ...change }));
  }
  assert.doesNotThrow(() => validateAdConfiguration({ ...configuration, state: "live", cmpReady: true }));
});

test("live placement fails closed without CMP configuration even when IDs are valid", () => {
  const decision = adSlotDecision("article-body", "/blog/guide/", { ...configuration, state: "live" });
  assert.equal(decision.render, false);
  assert.equal(decision.request, false);
});

test("preview and disabled exports never advertise a seller", () => {
  for (const state of ["disabled", "preview"] as const) {
    assert.doesNotMatch(adsTxt({ ...configuration, state }), /google\.com|pub-/);
  }
});

test("workbook, download and policy pages cannot request ads in any state", () => {
  for (const state of ["disabled", "preview", "pending-review", "live"] as const) {
    for (const route of ["/", "/viewer/", "/privacy/", "/terms/", "/about/"]) {
      const decision = adSlotDecision("article-body", route, { ...configuration, state, cmpReady: true });
      assert.equal(decision.render, false);
      assert.equal(decision.request, false);
    }
  }
});
