import { mkdir, rm, writeFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const ASSETS = path.join(ROOT, "src", "assets");
const TMP = path.join(ROOT, ".tmp", "og");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8", timeout: 15000 });
    if (!result.error && result.status === 0) return candidate;
  }
  throw new Error("Chrome/Edge が見つかりません。CHROME_PATH を設定してください。");
}

const mark = `
<svg class="mark" viewBox="0 0 40 40" aria-hidden="true">
  <rect width="40" height="40" rx="11" fill="#FAF8F3"/>
  <path d="M10.5 30V21.5a9.5 9.5 0 0 1 19 0V30" fill="none" stroke="#1D6258" stroke-width="2" stroke-linecap="round"/>
  <path d="M15.8 30v-6.6a4.2 4.2 0 0 1 8.4 0V30" fill="none" stroke="#1D6258" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>
  <circle cx="20" cy="8.4" r="1.7" fill="#1D6258"/>
</svg>`;

const ogHtml = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; }
  body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 330px;
    gap: 52px;
    padding: 64px 68px 56px;
    background: #123f38;
    color: #faf8f3;
    font-family: "Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .mark { width: 44px; height: 44px; }
  .brand p { margin: 0; }
  .brand strong { display: block; font-size: 21px; letter-spacing: .04em; }
  .brand span { display: block; margin-top: 1px; color: #b9d1c6; font-size: 11px; letter-spacing: .16em; }
  .copy { display: flex; flex-direction: column; justify-content: center; padding-top: 20px; }
  .eyebrow { margin: 0 0 20px; color: #c7dcd1; font-size: 12px; letter-spacing: .2em; }
  h1 {
    margin: 0;
    font-family: "Yu Mincho", "Hiragino Mincho ProN", serif;
    font-size: 62px;
    font-weight: 600;
    line-height: 1.34;
    letter-spacing: .01em;
  }
  h1 em { color: #d8e7de; font-style: normal; }
  .lead { margin: 22px 0 0; color: #c4d5cc; font-size: 16px; line-height: 1.9; }
  .panel {
    align-self: center;
    padding: 22px;
    border: 1px solid rgba(250,248,243,.2);
    border-radius: 20px;
    background: rgba(250,248,243,.07);
  }
  .panel-title { margin: 0 0 14px; color: #cfe0d7; font-size: 11px; letter-spacing: .16em; }
  .method { display: flex; align-items: baseline; gap: 11px; padding: 13px 0; border-top: 1px solid rgba(250,248,243,.13); }
  .method:first-of-type { border-top: 0; padding-top: 0; }
  .method b { color: #8fb7a7; font-size: 11px; font-weight: 700; letter-spacing: .08em; }
  .method span { font-family: "Yu Mincho", "Hiragino Mincho ProN", serif; font-size: 19px; }
  .footer { position: absolute; left: 68px; bottom: 38px; display: flex; gap: 22px; color: #9dbbb0; font-size: 11px; letter-spacing: .05em; }
  .footer span::before { content: "·"; margin-right: 8px; color: #6f998a; }
</style>
</head>
<body>
  <div>
    <div class="brand">${mark}<p><strong>保育士リトリート</strong><span>LABOR UNION OPERATED</span></p></div>
    <div class="copy">
      <p class="eyebrow">保育士の退職相談・退職代行</p>
      <h1>保育士の退職代行。<br><em>保育の悩みから、<br>相談できる。</em></h1>
      <p class="lead">AIチャット、元保育士へのLINE・電話相談。<br>話しやすい方法を選べます。</p>
    </div>
  </div>
  <aside class="panel">
    <p class="panel-title">CONTACT / 3 WAYS</p>
    <div class="method"><b>01</b><span>保育特化AIチャット</span></div>
    <div class="method"><b>02</b><span>元保育士にLINE相談</span></div>
    <div class="method"><b>03</b><span>元保育士に電話相談</span></div>
  </aside>
  <div class="footer"><span>労働組合運営</span><span>AI・LINE・電話相談</span></div>
</body>
</html>`;

const iconHtml = `<!doctype html>
<html lang="ja">
<head><meta charset="utf-8"><style>
  html, body { margin: 0; width: 180px; height: 180px; overflow: hidden; }
  body { display: grid; place-items: center; background: #1D6258; }
  svg { width: 180px; height: 180px; }
</style></head>
<body>
<svg viewBox="0 0 64 64" aria-hidden="true">
  <rect width="64" height="64" fill="#1D6258"/>
  <path d="M18 48V36a14 14 0 0 1 28 0v12" fill="none" stroke="#FAF8F3" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M25.4 48V38.8a6.6 6.6 0 0 1 13.2 0V48" fill="none" stroke="#FAF8F3" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>
  <circle cx="32" cy="14.6" r="2.4" fill="#FAF8F3"/>
</svg>
</body></html>`;

function screenshot(chrome, htmlFile, output, width, height) {
  const profile = path.join(TMP, `profile-${width}x${height}`);
  const result = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--force-device-scale-factor=1",
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      `--screenshot=${output}`,
      `file:///${htmlFile.replace(/\\/g, "/")}`,
    ],
    { encoding: "utf8", timeout: 120000 },
  );
  if (result.status !== 0) {
    throw new Error(`Chrome screenshot failed (${width}x${height}): ${result.stderr || result.stdout}`);
  }
}

async function main() {
  const chrome = findChrome();
  await mkdir(ASSETS, { recursive: true });
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });

  const ogHtmlPath = path.join(TMP, "og.html");
  const iconHtmlPath = path.join(TMP, "icon.html");
  const ogPath = path.join(ASSETS, "og-image.png");
  const iconPath = path.join(ASSETS, "apple-touch-icon.png");

  await writeFile(ogHtmlPath, ogHtml, "utf8");
  await writeFile(iconHtmlPath, iconHtml, "utf8");

  screenshot(chrome, ogHtmlPath, ogPath, 1200, 630);
  screenshot(chrome, iconHtmlPath, iconPath, 180, 180);

  for (const output of [ogPath, iconPath]) {
    const info = await stat(output);
    if (info.size < 2000) throw new Error(`Generated file looks empty: ${output}`);
    console.log(`${path.relative(ROOT, output)}: ${(info.size / 1024).toFixed(1)} KB`);
  }

  await rm(TMP, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
