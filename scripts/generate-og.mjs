import { mkdir, readFile, rm, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const ASSETS = path.join(ROOT, "src", "assets");
const TMP = path.join(ROOT, ".tmp", "og");

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Users/HasegawaSyunpei/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe",
  "C:/Users/HasegawaSyunpei/AppData/Local/ms-playwright/chromium-1187/chrome-win/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Chrome/Edge が見つかりません。CHROME_PATH を設定してください。");
}

function buildOgHtml(iconDataUrl) {
  return `<!doctype html>
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
  .mark { width: 52px; height: 52px; border-radius: 14px; object-fit: cover; border: 2px solid rgba(250,248,243,.35); background: #FAF8F3; }
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
  .panel-avatar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(250,248,243,.15);
  }
  .panel-avatar img {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(250,248,243,.45);
    background: #FAF8F3;
  }
  .panel-avatar div strong { display: block; font-size: 15px; color: #faf8f3; }
  .panel-avatar div span { display: block; font-size: 11px; color: #c7dcd1; margin-top: 2px; }
  .panel-title { margin: 0 0 12px; color: #cfe0d7; font-size: 11px; letter-spacing: .16em; }
  .method { display: flex; align-items: baseline; gap: 11px; padding: 11px 0; border-top: 1px solid rgba(250,248,243,.13); }
  .method:first-of-type { border-top: 0; padding-top: 0; }
  .method b { color: #8fb7a7; font-size: 11px; font-weight: 700; letter-spacing: .08em; }
  .method span { font-family: "Yu Mincho", "Hiragino Mincho ProN", serif; font-size: 18px; }
  .footer { position: absolute; left: 68px; bottom: 38px; display: flex; gap: 22px; color: #9dbbb0; font-size: 11px; letter-spacing: .05em; }
  .footer span::before { content: "·"; margin-right: 8px; color: #6f998a; }
</style>
</head>
<body>
  <div>
    <div class="brand"><img class="mark" src="${iconDataUrl}" alt=""><p><strong>保育士リトリート</strong><span>LABOR UNION OPERATED</span></p></div>
    <div class="copy">
      <p class="eyebrow">保育士の退職相談・退職代行</p>
      <h1>保育士の退職代行。<br><em>保育の悩みから、<br>相談できる。</em></h1>
      <p class="lead">AIチャット、元保育士へのLINE・電話相談。<br>話しやすい方法を選べます。</p>
    </div>
  </div>
  <aside class="panel">
    <div class="panel-avatar">
      <img src="${iconDataUrl}" alt="">
      <div>
        <strong>元保育士・女性カウンセラー</strong>
        <span>24時間受付・相談料0円</span>
      </div>
    </div>
    <p class="panel-title">CONTACT / 3 WAYS</p>
    <div class="method"><b>01</b><span>元保育士にLINE相談</span></div>
    <div class="method"><b>02</b><span>元保育士に電話相談</span></div>
    <div class="method"><b>03</b><span>保育特化AIチャット</span></div>
  </aside>
  <div class="footer"><span>労働組合運営</span><span>AI・LINE・電話相談</span></div>
</body>
</html>`;
}

function buildIcoBuffer(images) {
  const headerSize = 6 + images.length * 16;
  const totalSize = headerSize + images.reduce((acc, img) => acc + img.data.length, 0);
  const ico = Buffer.alloc(totalSize);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(images.length, 4);
  let offset = headerSize;
  images.forEach((img, idx) => {
    const dirOffset = 6 + idx * 16;
    ico.writeUInt8(img.width, dirOffset);
    ico.writeUInt8(img.height, dirOffset + 1);
    ico.writeUInt8(0, dirOffset + 2);
    ico.writeUInt8(0, dirOffset + 3);
    ico.writeUInt16LE(1, dirOffset + 4);
    ico.writeUInt16LE(32, dirOffset + 6);
    ico.writeUInt32LE(img.data.length, dirOffset + 8);
    ico.writeUInt32LE(offset, dirOffset + 12);
    img.data.copy(ico, offset);
    offset += img.data.length;
  });
  return ico;
}

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

  const brandIconBuf = await readFile(path.join(ASSETS, "brand-icon.png"));
  const iconDataUrl = `data:image/png;base64,${brandIconBuf.toString("base64")}`;

  const ogHtmlPath = path.join(TMP, "og.html");
  const ogPath = path.join(ASSETS, "og-image.png");
  const iconPath = path.join(ASSETS, "apple-touch-icon.png");

  await writeFile(ogHtmlPath, buildOgHtml(iconDataUrl), "utf8");
  screenshot(chrome, ogHtmlPath, ogPath, 1200, 630);

  // Build favicon.ico and favicon.svg from the resized PNG icons
  const png32 = await readFile(path.join(ASSETS, "favicon-32.png"));
  const png48 = await readFile(path.join(ASSETS, "favicon-48.png"));
  const png96 = await readFile(path.join(ASSETS, "favicon-96.png"));

  const icoBuf = buildIcoBuffer([
    { width: 32, height: 32, data: png32 },
    { width: 48, height: 48, data: png48 },
  ]);
  await writeFile(path.join(ASSETS, "favicon.ico"), icoBuf);

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="保育士リトリート">\n  <image href="data:image/png;base64,${png96.toString("base64")}" width="96" height="96"/>\n</svg>\n`;
  await writeFile(path.join(ASSETS, "favicon.svg"), svgContent, "utf8");

  for (const output of [ogPath, iconPath, path.join(ASSETS, "favicon.ico"), path.join(ASSETS, "favicon.svg")]) {
    const info = await stat(output);
    if (info.size < 500) throw new Error(`Generated file looks empty: ${output}`);
    console.log(`${path.relative(ROOT, output)}: ${(info.size / 1024).toFixed(1)} KB`);
  }

  await rm(TMP, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
