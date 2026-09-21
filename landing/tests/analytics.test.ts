import { strict as assert } from "node:assert";
import test from "node:test";
import { JSDOM } from "jsdom";

process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123456";
process.env.NEXT_PUBLIC_SITE_ORIGIN = "https://tashukbiz.github.io";
process.env.NEXT_PUBLIC_BASE_PATH = "/nativesheets";

test("consented visits and download clicks queue once, without sending workbook inputs", async () => {
  const { trackPageView, trackDownload } = await import("../src/site/analytics");
  const { setConsent, withdrawConsent } = await import("../src/site/consent");
  const dom = new JSDOM("<title>Native Sheets</title>", {
    url: "https://tashukbiz.github.io/nativesheets/viewer/?file=private.xlsx#A1",
    referrer: "https://search.example/search?q=private",
  });
  Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
  Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
  const commands = () => (window.dataLayer ?? []).map((entry) => Array.from(entry as IArguments));
  const events = () => commands().filter((entry) => entry[0] === "event");

  trackPageView("/nativesheets/viewer/", "tool");
  trackDownload("hero");
  assert.equal(window.dataLayer, undefined, "no queue exists before consent");

  setConsent({ analytics: "granted", ads: "denied" });
  trackPageView("/nativesheets/viewer/?file=private.xlsx#A1", "tool");
  assert.equal(commands()[1][0], "config", "configuration precedes the first visit");
  assert.equal((commands()[1][2] as Record<string, unknown>).send_page_view, false);
  assert.equal(events().length, 1, "the initial visit is retained before gtag.js loads");
  const visit = events()[0][2] as Record<string, unknown>;
  assert.equal(visit.page_path, "/nativesheets/viewer/");
  assert.equal(visit.page_location, "https://tashukbiz.github.io/nativesheets/viewer/");
  assert.equal(visit.page_referrer, "https://search.example/search");

  for (const placement of ["header", "hero", "installation", "bottom"] as const) {
    trackDownload(placement);
  }
  const downloads = events().filter((entry) => entry[1] === "file_download");
  assert.equal(downloads.length, 4);
  assert.deepEqual(downloads.map((entry) => (entry[2] as Record<string, unknown>).placement),
    ["header", "hero", "installation", "bottom"]);
  for (const entry of downloads) {
    assert.equal((entry[2] as Record<string, unknown>).link_url,
      "https://tashukbiz.github.io/nativesheets/NativeSheets.zip");
  }
  assert.doesNotMatch(JSON.stringify(commands()), /private|#A1/);

  document.cookie = "native_sheets_ga=identifier; path=/nativesheets";
  document.cookie = "unrelated=keep; path=/";
  withdrawConsent();
  const count = events().length;
  trackDownload("header");
  trackPageView("/nativesheets/", "home");
  assert.equal(events().length, count, "withdrawal stops future events");
  assert.equal((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123456"], true);
  assert.doesNotMatch(document.cookie, /native_sheets_ga/);
  assert.match(document.cookie, /unrelated=keep/);

  setConsent({ analytics: "granted", ads: "denied" });
  trackDownload("hero");
  assert.equal(events().length, count + 1);
  assert.equal(commands().filter((entry) => entry[0] === "config").length, 1);
  assert.equal((window as unknown as Record<string, unknown>)["ga-disable-G-TEST123456"], false);

  Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
  setConsent({ analytics: "granted", ads: "denied" });
  trackDownload("hero");
  assert.equal(events().length, count + 1, "GPC prevents analytics even if old consent was granted");
  dom.window.close();
});

test("page URLs are sanitised and route categories support GitHub Pages prefixes", async () => {
  const { safePageUrl } = await import("../src/site/analytics");
  const { pageTypeOf } = await import("../src/components/Analytics");
  assert.equal(safePageUrl("https://host.test/path?q=secret#cell"), "https://host.test/path");
  assert.equal(safePageUrl("blob:https://host.test/secret"), "");
  assert.equal(safePageUrl("not a URL"), "");
  assert.equal(pageTypeOf("/nativesheets/"), "home");
  assert.equal(pageTypeOf("/nativesheets/blog/guide/"), "article");
  assert.equal(pageTypeOf("/nativesheets/viewer/"), "tool");
});
