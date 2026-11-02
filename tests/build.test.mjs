import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const PREVIEW_OUT = path.join(ROOT, "dist", "test-preview");
const PUBLIC_OUT = path.join(ROOT, "dist", "test-public");
const BLOCKED_OUT = path.join(ROOT, "dist", "test-blocked");

function runBuild(args) {
  return spawnSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs"), ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
  });
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function read(relative) {
  return readFile(path.join(ROOT, relative), "utf8");
}

test("preview build is noindex and marked as review-only", async () => {
  await rm(PREVIEW_OUT, { recursive: true, force: true });
  const result = runBuild([
    `--out=${PREVIEW_OUT}`,
    "--docs-out=.tmp/test-preview-docs.md",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const html = await read("dist/test-preview/index.html");
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /プレビュー版/);
  assert.match(html, /data-preview-only/);
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.match(await read("dist/test-preview/robots.txt"), /Disallow: \//);
  assert.equal(await exists(path.join(PREVIEW_OUT, "sitemap.xml")), false);

  await rm(PREVIEW_OUT, { recursive: true, force: true });
});

test("production build succeeds with a complete, approved config", async () => {
  await rm(PUBLIC_OUT, { recursive: true, force: true });
  const result = runBuild([
    "--production",
    "--config=tests/fixtures/complete.config.json",
    `--out=${PUBLIC_OUT}`,
    "--docs-out=.tmp/test-public-docs.md",
  ]);

  assert.equal(result.status, 0, result.stderr);

  const html = await read("dist/test-public/index.html");
  assert.match(html, /<title>保育士の退職代行｜元保育士にLINE・電話相談｜リトリート<\/title>/);
  assert.match(html, /id="ai-chat"/);
  assert.match(html, /action="\/api\/chat"/);
  assert.doesNotMatch(html, /OPENAI_API_KEY|test-secret-never-in-client/);
  assert.doesNotMatch(await read("dist/test-public/assets/app.js"), /OPENAI_API_KEY|Bearer\s/);
  assert.match(html, /<link rel="canonical" href="https:\/\/hoiku-retreat\.jp\/">/);
  assert.match(html, /index,follow,max-image-preview:large/);
  assert.doesNotMatch(html, /確認中/);
  assert.doesNotMatch(html, /プレビュー/);
  assert.doesNotMatch(html, /data-preview-only/);
  assert.match(html, /href="https:\/\/lin\.ee\/AbCdEfG"/);
  assert.match(html, /href="tel:0398765432"/);
  assert.match(html, /href="#ai-chat"/);
  assert.match(html, /"price": "36000"/);

  for (const file of ["about/index.html", "privacy/index.html", "terms/index.html", "disclosures/index.html", "404.html", "robots.txt", "sitemap.xml", "_headers"]) {
    assert.equal(await exists(path.join(PUBLIC_OUT, file)), true, `${file} should exist`);
  }
  assert.equal(await exists(path.join(PUBLIC_OUT, ".env")), false, ".env must never be copied into output");

  const robots = await read("dist/test-public/robots.txt");
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/hoiku-retreat\.jp\/sitemap\.xml/);

  const sitemap = await read("dist/test-public/sitemap.xml");
  assert.match(sitemap, /https:\/\/hoiku-retreat\.jp\/about\//);
  assert.doesNotMatch(sitemap, /404\.html/);

  const notFound = await read("dist/test-public/404.html");
  assert.match(notFound, /noindex,nofollow,noarchive/);

  await rm(PUBLIC_OUT, { recursive: true, force: true });
});

test("production build refuses the current unconfirmed config without writing output", async () => {
  await rm(BLOCKED_OUT, { recursive: true, force: true });
  const result = runBuild([
    "--production",
    `--out=${BLOCKED_OUT}`,
    "--docs-out=.tmp/test-blocked-docs.md",
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Production build stopped/);
  assert.equal(await exists(BLOCKED_OUT), false);
});
