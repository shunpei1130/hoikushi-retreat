import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectIssues, productionReady, scanProductionText } from "../scripts/lib/validate.mjs";
import { computeTotal, channelStatus, priceValue } from "../scripts/lib/components.mjs";
import { normalizeOrigin, isFilled } from "../scripts/lib/config.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

async function loadJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

test("current config is preview-only and reports blockers", async () => {
  const config = await loadJson("site.config.json");
  const issues = collectIssues(config);

  assert.equal(productionReady(config), false);
  assert.ok(issues.blockers.length > 0);
  assert.equal(config.operator.legalName, "保育士リトリート");
  assert.ok(issues.missing.some((entry) => entry.path === "publication.businessApproved"));
  assert.ok(issues.missing.some((entry) => entry.path === "canonicalOrigin"));
  assert.ok(issues.missing.some((entry) => entry.path === "channels.phone.verified"));
  assert.ok(issues.missing.some((entry) => entry.path === "staff"));
  assert.equal(computeTotal(config).amount, 24800);
  assert.equal(config.pricing.total.includesAllSupportCosts, true);
  assert.equal(
    issues.blockers.some((entry) => ["support-fee", "union-enrollment", "union-monthly"].some((id) => entry.path === `pricing.items.${id}.amount`)),
    false,
  );
});

test("complete fixture has no production blockers", async () => {
  const config = await loadJson("tests/fixtures/complete.config.json");
  const issues = collectIssues(config);

  assert.deepEqual(issues.blockers, []);
  assert.equal(productionReady(config), true);
});

test("production rules reject placeholder URLs, phones, and unverified staff", async () => {
  const config = await loadJson("tests/fixtures/complete.config.json");
  config.canonicalOrigin = "https://example.com";
  config.channels.phone.number = "03-0000-0000";
  config.staff[0].role = "";
  config.staff[0].approved = false;

  const issues = collectIssues(config);
  const paths = issues.blockers.map((entry) => entry.path);

  assert.ok(paths.includes("canonicalOrigin"));
  assert.ok(paths.includes("channels.phone.number"));
  assert.ok(paths.includes("staff[0].role"));
  assert.ok(paths.includes("staff[0].approved"));
});

test("tax and total only resolve when every component is verified", async () => {
  const config = await loadJson("tests/fixtures/complete.config.json");
  const total = computeTotal(config);
  assert.equal(total.amount, 36000);
  assert.equal(total.fixed, false);
  assert.deepEqual(
    total.components,
    config.pricing.items.filter((item) => config.pricing.total.componentIds.includes(item.id)),
  );

  config.pricing.items.find((item) => item.id === "union-monthly").verified = false;
  assert.equal(computeTotal(config).amount, null);
  assert.equal(priceValue(config.pricing.items.find((item) => item.id === "union-monthly"), "production").includes("未設定"), true);
});

test("channel links are withheld until verified", async () => {
  const config = await loadJson("tests/fixtures/complete.config.json");

  assert.equal(channelStatus(config, "line").available, true);
  assert.equal(channelStatus(config, "line").href, "https://lin.ee/AbCdEfG");
  assert.equal(channelStatus(config, "phone").href, "tel:0398765432");

  config.channels.line.verified = false;
  config.channels.phone.verified = false;
  assert.equal(channelStatus(config, "line").available, false);
  assert.equal(channelStatus(config, "phone").available, false);
});

test("placeholder scan catches preview and test values", () => {
  const hits = scanProductionText(
    "料金は確認中です。TODO: https://example.com 03-0000-0000 プレビュー版",
  );
  assert.ok(hits.includes("/確認中/"));
  assert.ok(hits.includes("/TODO/i"));
  assert.ok(hits.includes("/example\\.(com|org|net)/i"));
  assert.ok(hits.includes("/プレビュー/"));
  assert.ok(hits.includes("テスト電話番号"));
});

test("origin normalization removes trailing slashes", () => {
  assert.equal(normalizeOrigin("https://hoiku-retreat.jp///"), "https://hoiku-retreat.jp");
  assert.equal(normalizeOrigin(null), null);
  assert.equal(isFilled(false), true);
  assert.equal(isFilled(""), false);
});
