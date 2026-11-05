import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

const REQUIRED_HTML = [
  "index.html",
  "about/index.html",
  "privacy/index.html",
  "terms/index.html",
  "disclosures/index.html",
  "404.html",
];

const REQUIRED_ASSETS = [
  "assets/styles.css",
  "assets/fonts/kiwi-maru.css",
  "assets/app.js",
  "assets/favicon.svg",
  "assets/og-image.png",
  "assets/apple-touch-icon.png",
];

const FORBIDDEN_CLAIMS = [
  "必ず辞められる",
  "全員即日退職",
  "園からの連絡ゼロを保証",
  "全国最安",
  "業界No.1",
  "相談者が急増",
  "今相談しないと危険",
];

const PREVIEW_PATTERNS = [/確認中/, /プレビュー/, /TODO/i, /TBD/i, /example\.(com|org|net)/i, /localhost/i];

function parseArgs(argv) {
  const args = {
    dir: "dist/preview",
    mode: null,
    out: "docs/verification/audit.json",
    screenshots: "screenshots/preview",
  };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--dir=")) args.dir = arg.slice("--dir=".length);
    else if (arg.startsWith("--mode=")) args.mode = arg.slice("--mode=".length);
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
    else if (arg.startsWith("--screenshots=")) args.screenshots = arg.slice("--screenshots=".length);
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node scripts/audit.mjs [--dir=dist/preview] [--mode=preview|production] [--out=docs/verification/audit.json] [--screenshots=screenshots/preview]",
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  if (args.mode && !["preview", "production"].includes(args.mode)) {
    console.error("--mode must be preview or production");
    process.exit(2);
  }
  return args;
}

function decodeEntities(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function attr(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
  const match = pattern.exec(tag);
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? "");
}

function stripTags(html) {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  return decodeEntities(withoutScripts.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return decodeEntities(String(value).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values)];
}

function routeForFile(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (normalized === "index.html") return "/";
  if (normalized === "404.html") return "/404.html";
  if (normalized.endsWith("/index.html")) return `/${normalized.slice(0, -"index.html".length)}`;
  return `/${normalized}`;
}

function fileForLinkPath(pathname) {
  if (pathname === "/") return "index.html";
  const withoutLeading = pathname.replace(/^\/+/, "");
  if (withoutLeading === "") return "index.html";
  if (withoutLeading.endsWith("/")) return `${withoutLeading}index.html`;
  return withoutLeading;
}

function linkPath(href, pageRoute) {
  if (!href) return null;
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(href)) return null;
  if (href.startsWith("#")) return null;
  const clean = href.split("?")[0].split("#")[0];
  if (!clean) return null;
  if (clean.startsWith("/")) return clean;
  const base = pageRoute.endsWith("/") ? pageRoute : `${pageRoute.replace(/[^/]+$/, "")}`;
  return path.posix.normalize(`${base}${clean}`);
}

function pngSize(buffer) {
  if (buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function exists(file) {
  try {
    await access(file, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function collectHtmlFiles(dir) {
  const results = [];
  async function walk(current, prefix = "") {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(path.join(current, entry.name), relative);
      else if (entry.isFile() && entry.name.endsWith(".html")) results.push(relative);
    }
  }
  await walk(dir);
  return results.sort();
}

async function checkPage({ file, html, pageMap, mode, report }) {
  const route = routeForFile(file);
  const pageErrors = [];
  const pageWarnings = [];
  const addError = (check, message) => pageErrors.push({ page: route, check, message });
  const addWarning = (check, message) => pageWarnings.push({ page: route, check, message });

  if (!/^<!doctype html>/i.test(html.trimStart())) addError("doctype", "HTML の先頭に <!doctype html> がありません");
  if (!/<html\b[^>]*\blang="ja"/i.test(html)) addError("lang", "html lang=\"ja\" がありません");
  const dataMode = /<html\b[^>]*\bdata-mode="([^"]+)"/i.exec(html)?.[1];
  if (dataMode !== mode) addError("mode", `data-mode が ${mode} ではありません（${dataMode ?? "なし"}）`);

  const metas = (html.match(/<meta\b[^>]*>/gi) || []).map((tag) => {
    const name = attr(tag, "name") || attr(tag, "property") || attr(tag, "http-equiv");
    return { tag, name, content: attr(tag, "content") };
  });
  const metaValue = (name) => metas.find((entry) => entry.name?.toLowerCase() === name.toLowerCase())?.content ?? null;

  if (!/<meta\b[^>]*charset="utf-8"/i.test(html)) addError("charset", "charset=utf-8 がありません");
  if (!/name="viewport"\s+content="width=device-width, initial-scale=1"/i.test(html)) {
    addError("viewport", "viewport 設定がありません");
  }

  const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  if (!title || normalizeText(title).length === 0) addError("title", "title がありません");
  else if (normalizeText(title).length > 70) addWarning("title-length", "title が70文字を超えています");

  const description = metaValue("description");
  if (!description) addError("description", "meta description がありません");
  else if (description.length < 50) addWarning("description-length", "description が50文字未満です");
  else if (description.length > 180) addWarning("description-length", "description が180文字を超えています");

  const robots = metaValue("robots");
  if (!robots) addError("robots", "meta robots がありません");
  if (mode === "preview") {
    if (!robots?.includes("noindex")) addError("robots", "プレビューなのに noindex がありません");
    if (html.includes('rel="canonical"')) addError("canonical", "プレビューに canonical が出力されています");
    if (!html.includes("data-preview-only")) addError("preview-marker", "プレビューの明示マーカーがありません");
  } else if (route === "/404.html") {
    if (!robots?.includes("noindex")) addError("robots", "404 は noindex にしてください");
  } else {
    if (!robots?.includes("index,follow")) addError("robots", "公開ページなのに index,follow がありません");
    const canonical = (html.match(/<link\b[^>]*rel="canonical"[^>]*>/i) || [])[0];
    const href = canonical ? attr(canonical, "href") : null;
    if (!href) addError("canonical", "canonical がありません");
    else if (!/^https:\/\//.test(href)) addError("canonical", "canonical が https の絶対URLではありません");
    if (href && !href.endsWith(route === "/" ? "/" : route)) {
      addError("canonical", `canonical がページURLと一致しません（${href}）`);
    }
  }

  for (const property of ["og:title", "og:description", "og:image", "og:type", "twitter:card"]) {
    if (!metaValue(property)) addError("social-meta", `${property} がありません`);
  }

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length !== 1) addError("h1", `h1 が ${h1s.length} 個あります`);
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
    level: Number(match[1]),
    text: normalizeText(match[2]),
  }));
  if (headings[0] && headings[0].level !== 1) addError("heading-order", "最初の見出しが h1 ではありません");
  let previousLevel = 0;
  for (const heading of headings) {
    if (previousLevel > 0 && heading.level > previousLevel + 1) {
      addError("heading-order", `h${previousLevel} の直後に h${heading.level} があります（${heading.text.slice(0, 40)}）`);
    }
    if (!heading.text) addError("heading-empty", "空の見出しがあります");
    previousLevel = heading.level;
  }

  const idMatches = [...html.matchAll(/\sid="([^"]*)"/g)].map((match) => decodeEntities(match[1]));
  const duplicateIds = unique(idMatches.filter((id, index) => idMatches.indexOf(id) !== index));
  if (duplicateIds.length > 0) addError("duplicate-id", `重複ID: ${duplicateIds.join(", ")}`);

  const labelledBy = [...html.matchAll(/\baria-labelledby="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );
  for (const id of unique(labelledBy)) {
    if (!idMatches.includes(id)) addError("aria-labelledby", `aria-labelledby の参照先 #${id} がありません`);
  }
  const describedBy = [...html.matchAll(/\baria-describedby="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );
  for (const id of unique(describedBy)) {
    if (!idMatches.includes(id)) addError("aria-describedby", `aria-describedby の参照先 #${id} がありません`);
  }

  const anchors = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => match[0]);
  for (const anchor of anchors) {
    const href = attr(anchor, "href");
    if (!href || href === "#") {
      addError("empty-link", `空のリンクがあります: ${normalizeText(anchor).slice(0, 40) || "(テキストなし)"}`);
      continue;
    }
    if (/^javascript:/i.test(href)) addError("javascript-link", "javascript: リンクがあります");
    if (/^http:\/\//i.test(href)) addError("http-link", `http リンクがあります: ${href}`);
    if (attr(anchor, "target") === "_blank") {
      const rel = attr(anchor, "rel") || "";
      if (!rel.includes("noopener")) addError("external-link", `target=_blank に rel=noopener がありません: ${href}`);
    }
    if (!normalizeText(anchor) && !attr(anchor, "aria-label")) {
      addError("link-name", `リンクにアクセシブルな名前がありません: ${href}`);
    }

    const targetPath = linkPath(href, route);
    if (targetPath) {
      const targetFile = fileForLinkPath(targetPath);
      if (!pageMap.has(targetFile)) addError("internal-link", `リンク先がありません: ${href}`);
    }
    if (href.includes("#")) {
      const hash = decodeEntities(href.split("#").slice(1).join("#"));
      if (hash) {
        const hashTargetFile = targetPath ? fileForLinkPath(targetPath) : file;
        const targetHtml = pageMap.get(hashTargetFile);
        if (targetHtml) {
          const targetIds = new Set([...targetHtml.matchAll(/\sid="([^"]*)"/g)].map((match) => decodeEntities(match[1])));
          if (!targetIds.has(hash)) addError("anchor", `アンカー先がありません: ${href} (#${hash})`);
        } else {
          addError("anchor", `アンカーの対象ページがありません: ${href}`);
        }
      }
    }
  }

  const assetRefs = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)]
    .map((match) => decodeEntities(match[1]))
    .filter((href) => !href.startsWith("//") && /\.[a-z0-9]+$/i.test(href.split("?")[0]));
  const srcsetRefs = [...html.matchAll(/srcset="([^"]+)"/g)].flatMap((match) =>
    match[1]
      .split(",")
      .map((part) => decodeEntities(part.trim().split(/\s+/)[0]))
      .filter((href) => href.startsWith("/") && /\.[a-z0-9]+$/i.test(href.split("?")[0])),
  );
  for (const ref of unique([...assetRefs, ...srcsetRefs])) {
    const targetFile = fileForLinkPath(ref.split("?")[0]);
    if (!pageMap.has(targetFile) && !(await exists(path.join(report.dir, targetFile)))) {
      addError("asset-link", `参照ファイルがありません: ${ref}`);
    }
  }

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  for (const image of images) {
    if (!/\balt\s*=/.test(image)) addError("img-alt", `alt のない img があります: ${attr(image, "src") || "(srcなし)"}`);
  }

  if (/\son[a-z]+\s*=/i.test(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""))) {
    addError("inline-handler", "インラインイベントハンドラがあります");
  }
  if (/\sstyle="/i.test(html)) addError("inline-style", "インライン style 属性があります（CSP style-src 'self' と不整合）");

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const jsonLdScripts = scripts.filter((match) => attr(`<script ${match[1]}>`, "type") === "application/ld+json");
  const otherInlineScripts = scripts.filter((match) => !attr(`<script ${match[1]}>`, "type")?.includes("ld+json") && match[2].trim());
  if (otherInlineScripts.length > 0) addError("inline-script", "JSON-LD 以外のインラインスクリプトがあります");

  if (jsonLdScripts.length !== 1) addError("json-ld", `JSON-LD が ${jsonLdScripts.length} 個あります（1個を想定）`);
  if (jsonLdScripts.length > 0) {
    const jsonLdText = jsonLdScripts[0][2];
    let parsed = null;
    try {
      parsed = JSON.parse(jsonLdText);
    } catch (error) {
      addError("json-ld", `JSON-LD を JSON として解析できません: ${error.message}`);
    }
    if (parsed) {
      if (parsed["@context"] !== "https://schema.org") addError("json-ld", "JSON-LD の @context が schema.org ではありません");
      if (!Array.isArray(parsed["@graph"]) || parsed["@graph"].length === 0) addError("json-ld", "JSON-LD の @graph が空です");
      const jsonText = JSON.stringify(parsed);
      if (/"@type":"(?:Review|AggregateRating)"/.test(jsonText) || /"ratingValue"|"reviewCount"|"aggregateRating"/.test(jsonText)) {
        addError("json-ld-claim", "JSON-LD にレビュー・評価データが含まれています");
      }
      if (mode === "production" && /example\.(com|org|net)|localhost|\.invalid/i.test(jsonText)) {
        addError("json-ld-placeholder", "JSON-LD にプレースホルダーのURLが残っています");
      }
    }

    const csp = metaValue("Content-Security-Policy");
    if (!csp) addError("csp", "meta CSP がありません");
    else {
      for (const directive of ["default-src 'none'", "base-uri 'none'", "object-src 'none'", "form-action 'none'"]) {
        if (!csp.includes(directive)) addError("csp", `CSP に ${directive} がありません`);
      }
      if (csp.includes("unsafe-inline") || csp.includes("unsafe-eval")) {
        addError("csp", "CSP に unsafe-inline / unsafe-eval が含まれています");
      }
      const hash = createHash("sha256").update(jsonLdText, "utf8").digest("base64");
      if (!csp.includes(`'sha256-${hash}'`)) addError("csp", "CSP の JSON-LD ハッシュが一致しません");
    }
  }

  for (const claim of FORBIDDEN_CLAIMS) {
    if (html.includes(claim)) addError("forbidden-claim", `未承認の断定表現があります: ${claim}`);
  }

  if (mode === "production") {
    for (const pattern of PREVIEW_PATTERNS) {
      if (pattern.test(html)) addError("preview-artifact", `公開HTMLにプレビュー由来の文字列が残っています: ${pattern}`);
    }
    if (html.includes("data-preview-only")) addError("preview-artifact", "data-preview-only が残っています");
    if (/class="[^"]*\bpending\b/.test(html)) addError("preview-artifact", "未確認表示（pending）が残っています");
  } else if (/\bexample\.(com|org|net)\b|localhost|127\.0\.0\.1/i.test(html)) {
    addWarning("test-domain", "プレビューにテスト用ドメインが含まれています");
  }

  const text = stripTags(html);
  if (route !== "/404.html" && text.length < 800) addWarning("content-length", `本文テキストが短すぎます（${text.length}文字）`);

  return {
    route,
    file,
    title: title ? normalizeText(title) : null,
    description,
    dataMode,
    errors: pageErrors,
    warnings: pageWarnings,
    textLength: text.length,
    internalLinks: anchors.length,
    jsonLdTypes: (() => {
      if (jsonLdScripts.length === 0) return [];
      try {
        return unique(
          (JSON.parse(jsonLdScripts[0][2])["@graph"] || []).map((node) =>
            Array.isArray(node["@type"]) ? node["@type"].join("+") : node["@type"],
          ),
        );
      } catch {
        return [];
      }
    })(),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const dir = path.resolve(ROOT, args.dir);
  if (!(await exists(dir))) {
    console.error(`Audit target not found: ${args.dir}. Run \`node scripts/build.mjs\` first.`);
    process.exit(1);
  }

  const htmlFiles = await collectHtmlFiles(dir);
  if (htmlFiles.length === 0) {
    console.error(`No HTML files found in ${args.dir}`);
    process.exit(1);
  }

  const pageMap = new Map();
  for (const file of htmlFiles) {
    pageMap.set(file.replaceAll("\\", "/"), await readFile(path.join(dir, file), "utf8"));
  }

  const mode =
    args.mode ||
    (/data-mode="production"/.test(pageMap.get("index.html") || "") ? "production" : "preview");
  const errors = [];
  const warnings = [];
  const pages = [];
  const report = { dir, mode };

  for (const file of REQUIRED_HTML) {
    if (!pageMap.has(file)) {
      errors.push({ page: routeForFile(file), check: "required-page", message: `${file} がありません` });
    }
  }
  for (const asset of REQUIRED_ASSETS) {
    if (!(await exists(path.join(dir, asset)))) {
      errors.push({ page: "-", check: "required-asset", message: `${asset} がありません` });
    }
  }

  for (const file of htmlFiles) {
    const result = await checkPage({
      file: file.replaceAll("\\", "/"),
      html: pageMap.get(file),
      pageMap,
      mode,
      report,
    });
    pages.push(result);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  const titles = pages.map((page) => page.title).filter(Boolean);
  const duplicateTitles = unique(titles.filter((title, index) => titles.indexOf(title) !== index));
  if (duplicateTitles.length > 0) {
    warnings.push({ page: "-", check: "duplicate-title", message: `title が重複しています: ${duplicateTitles.join(" / ")}` });
  }

  const home = pages.find((page) => page.route === "/");
  if (home) {
    const html = pageMap.get("index.html");
    const heroEnd = html.indexOf("</section>");
    const hero = heroEnd > 0 ? html.slice(0, heroEnd) : html;
    for (const channel of ["ai", "line", "phone"]) {
      if (!new RegExp(`data-channel="${channel}"`).test(hero)) {
        errors.push({ page: "/", check: "top-cta", message: `ファーストビューに ${channel} の相談入口がありません` });
      }
    }
    for (const id of ["hero-title", "talk", "consult", "ai-chat", "pricing", "faq"]) {
      if (!html.includes(`id="${id}"`)) errors.push({ page: "/", check: "section-id", message: `#${id} がありません` });
    }
    if (!/data-ai-chat-form/.test(html) || !/action="\/api\/chat"/.test(html)) {
      errors.push({ page: "/", check: "ai-chat-form", message: "AIチャットの送信フォームまたはAPIルートがありません" });
    }
    const exactH1 = "もう、一人で抱え込まなくて大丈夫。あなたが辞めても、絶対に大丈夫です。";
    if (!normalizeText(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || "").replace(/\s/g, "").includes(exactH1.replace(/\s/g, ""))) {
      errors.push({ page: "/", check: "h1-copy", message: "H1 が仕様のコピーと一致しません" });
    }
    for (const label of ["保育特化AIにチャットで聞く", "元保育士にLINEで相談する", "元保育士に電話で相談する"]) {
      if (!hero.includes(label)) errors.push({ page: "/", check: "top-cta-label", message: `ファーストビューに「${label}」がありません` });
    }
    if (!html.includes("AIは、人に相談するための必須ステップではありません")) {
      errors.push({ page: "/", check: "human-path", message: "AIを必須にしない説明文がありません" });
    }
    if (!html.includes("AIを経由しないと、人に相談できない構造にはしていません")) {
      errors.push({ page: "/", check: "human-path", message: "AIを経由しない導線の明示がありません" });
    }
  }

  const robotsPath = path.join(dir, "robots.txt");
  const robots = (await exists(robotsPath)) ? await readFile(robotsPath, "utf8") : null;
  if (!robots) {
    errors.push({ page: "-", check: "robots", message: "robots.txt がありません" });
  } else if (mode === "preview") {
    if (!/Disallow:\s*\//.test(robots)) errors.push({ page: "-", check: "robots", message: "プレビューなのに Disallow: / がありません" });
  } else {
    if (!/Allow:\s*\//.test(robots)) errors.push({ page: "-", check: "robots", message: "公開用 robots.txt に Allow: / がありません" });
    if (!/Sitemap:\s*https:\/\//.test(robots)) errors.push({ page: "-", check: "robots", message: "公開用 robots.txt に Sitemap がありません" });
  }

  const sitemapPath = path.join(dir, "sitemap.xml");
  if (mode === "production") {
    if (!(await exists(sitemapPath))) {
      errors.push({ page: "-", check: "sitemap", message: "sitemap.xml がありません" });
    } else {
      const sitemap = await readFile(sitemapPath, "utf8");
      const locations = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => decodeEntities(match[1].trim()));
      if (locations.length === 0) errors.push({ page: "-", check: "sitemap", message: "sitemap.xml に URL がありません" });
      if (locations.some((location) => !/^https:\/\//.test(location))) {
        errors.push({ page: "-", check: "sitemap", message: "sitemap.xml に https 以外の URL があります" });
      }
      if (locations.some((location) => location.endsWith("404.html"))) {
        errors.push({ page: "-", check: "sitemap", message: "sitemap.xml に 404 が含まれています" });
      }
      for (const location of locations) {
        const pathname = new URL(location).pathname;
        const expectedFile = fileForLinkPath(pathname);
        if (!pageMap.has(expectedFile)) {
          errors.push({ page: "-", check: "sitemap", message: `sitemap のURLに対応するページがありません: ${location}` });
        }
      }
      if (new Set(locations).size !== locations.length) {
        errors.push({ page: "-", check: "sitemap", message: "sitemap.xml に重複URLがあります" });
      }
    }
  } else if (await exists(sitemapPath)) {
    errors.push({ page: "-", check: "sitemap", message: "プレビューに sitemap.xml が出力されています" });
  }

  const headersPath = path.join(dir, "_headers");
  if (!(await exists(headersPath))) {
    errors.push({ page: "-", check: "headers", message: "_headers がありません" });
  } else {
    const headers = await readFile(headersPath, "utf8");
    for (const name of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Content-Security-Policy"]) {
      if (!headers.includes(`${name}:`)) errors.push({ page: "-", check: "headers", message: `_headers に ${name} がありません` });
    }
    if (!headers.includes("frame-ancestors 'none'")) {
      errors.push({ page: "-", check: "headers", message: "_headers の CSP に frame-ancestors 'none' がありません" });
    }
  }

  for (const asset of REQUIRED_ASSETS) {
    const target = path.join(dir, asset);
    if (!(await exists(target))) continue;
    const buffer = await readFile(target);
    if (buffer.length === 0) errors.push({ page: "-", check: "asset-empty", message: `${asset} が空です` });
    if (asset.endsWith(".png")) {
      const size = pngSize(buffer);
      if (!size) errors.push({ page: "-", check: "asset-image", message: `${asset} が PNG ではありません` });
      else if (asset.endsWith("og-image.png") && (size.width !== 1200 || size.height !== 630)) {
        errors.push({ page: "-", check: "asset-image", message: `og-image.png が 1200x630 ではありません（${size.width}x${size.height}）` });
      } else if (asset.endsWith("apple-touch-icon.png") && (size.width !== 180 || size.height !== 180)) {
        errors.push({ page: "-", check: "asset-image", message: `apple-touch-icon.png が 180x180 ではありません（${size.width}x${size.height}）` });
      }
    }
    if (asset.endsWith(".svg") && !buffer.toString("utf8").trimStart().startsWith("<svg")) {
      errors.push({ page: "-", check: "asset-image", message: `${asset} が SVG ではありません` });
    }
  }

  const screenshotDir = path.resolve(ROOT, args.screenshots);
  if (await exists(screenshotDir)) {
    const shots = await readdir(screenshotDir);
    for (const width of [360, 390, 430, 768, 1280, 1440]) {
      if (!shots.includes(`width-${width}.png`)) {
        warnings.push({ page: "-", check: "screenshots", message: `width-${width}.png がありません` });
      }
    }
    if (!shots.some((name) => name.startsWith("page-about-"))) {
      warnings.push({ page: "-", check: "screenshots", message: "下層ページのスクリーンショットがありません" });
    }
  } else {
    warnings.push({ page: "-", check: "screenshots", message: `${args.screenshots} がありません` });
  }

  const outPath = path.resolve(ROOT, args.out);
  const generatedAt = new Date().toISOString();
  const result = {
    generatedAt,
    target: path.relative(ROOT, dir).replaceAll("\\", "/"),
    mode,
    summary: {
      pages: pages.length,
      errors: errors.length,
      warnings: warnings.length,
      checks: [
        "HTML構造・見出し・ID重複",
        "内部リンク・アンカー・アセット参照",
        "title・description・robots・canonical・OGP",
        "JSON-LD と CSP ハッシュ",
        "禁止表現・プレビュー残存",
        "robots.txt・sitemap.xml・_headers",
        "OGP/Appleアイコンの画像寸法",
        "スクリーンショットの有無",
      ],
    },
    pages,
    errors,
    warnings,
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  for (const page of pages) {
    console.log(`${page.route.padEnd(16)} ${page.errors.length} error(s), ${page.warnings.length} warning(s), ${page.textLength} chars`);
  }
  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) console.log(`- [${warning.page}] ${warning.check}: ${warning.message}`);
  }
  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const error of errors) console.log(`- [${error.page}] ${error.check}: ${error.message}`);
  }
  console.log(`\nAudit (${mode}): ${errors.length} error(s), ${warnings.length} warning(s)`);
  console.log(`Report: ${path.relative(ROOT, outPath).replaceAll("\\", "/")}`);
  if (errors.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
