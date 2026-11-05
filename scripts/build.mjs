import { mkdir, readFile, rm, writeFile, copyFile, cp, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadConfig, CONFIG_PATH, normalizeOrigin } from "./lib/config.mjs";
import { collectIssues, scanProductionText } from "./lib/validate.mjs";
import { buildJsonLd, buildMeta } from "./lib/seo.mjs";
import { layout } from "./lib/layout.mjs";
import { escapeHtml } from "./lib/html.mjs";
import { renderHome } from "../src/pages/home.mjs";
import { renderAbout } from "../src/pages/about.mjs";
import { renderPrivacy } from "../src/pages/privacy.mjs";
import { renderTerms } from "../src/pages/terms.mjs";
import { renderDisclosures } from "../src/pages/disclosures.mjs";
import { renderNotFound } from "../src/pages/notfound.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

function parseArgs(argv) {
  const args = { production: false, out: null, config: null, docsOut: null };
  for (const arg of argv.slice(2)) {
    if (arg === "--production") args.production = true;
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length);
    else if (arg.startsWith("--config=")) args.config = arg.slice("--config=".length);
    else if (arg.startsWith("--docs-out=")) args.docsOut = arg.slice("--docs-out=".length);
    else if (arg === "--help" || arg === "-h") {
      console.log(
        `Usage: node scripts/build.mjs [--production] [--out=dist/preview] [--config=site.config.json] [--docs-out=docs/PRELAUNCH.md]`,
      );
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return args;
}

async function exists(file) {
  try {
    await access(file, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function pageFile(route) {
  if (route === "/") return "index.html";
  if (route.endsWith("/")) return `${route.slice(1)}index.html`;
  return route.replace(/^\//, "");
}

function sitemapXml(pages, origin, lastmod) {
  const urls = pages
    .filter((page) => !page.noindex && page.path !== "/404.html")
    .map(
      (page) => `  <url>
    <loc>${escapeXml(origin + page.path)}</loc>
    ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => {
    const map = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
    return map[character];
  });
}

function headersFile() {
  return `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: frame-ancestors 'none'

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

function groupIssues(issues) {
  const groups = new Map();
  for (const entry of issues) {
    if (!groups.has(entry.group)) groups.set(entry.group, []);
    groups.get(entry.group).push(entry);
  }
  return [...groups.entries()];
}

function blockersMarkdown({ issues, mode, config, origin, timestamp, configPath }) {
  const { missing, invalid, warnings } = issues;
  const all = [...missing, ...invalid];
  const manual = [
    "公開ドメインの所有・DNS・HTTPS・既存URL・Search Console の確認",
    "OpenAI API・LINE公式アカウント・LINE経由の電話相談フローを実環境で確認（指定されたテスト範囲のみ）",
    "料金・税区分・支払い・取消/返金・組合加入条件の規約との一致確認",
    "元保育士スタッフの氏名・経歴・担当窓口・本人確認・掲載許可",
    "個人情報の保存先・保存期間・削除方法・外部サービスの学習利用有無",
    "公開用スクリーンショット・操作・200/404・sitemap・canonical の最終確認",
    "本番ホスティングで `_headers` が反映されることの確認",
    "公開操作・DNS変更・広告・実送信を行わないことの最終承認",
  ];

  const table = (items) =>
    items.length === 0
      ? "なし"
      : `<table>
  <thead><tr><th>区分</th><th>設定キー</th><th>項目</th><th>状態</th></tr></thead>
  <tbody>
${items
  .map(
    (entry) =>
      `    <tr><td>${escapeHtml(entry.group)}</td><td><code>${escapeHtml(entry.path)}</code></td><td>${escapeHtml(entry.label)}</td><td>${escapeHtml(entry.reason)}</td></tr>`,
  )
  .join("\n")}
  </tbody>
</table>`;

  return `# 公開ブロッカー・未確認項目

> このファイルは \`scripts/build.mjs\` により自動生成されています。手動編集はビルドで上書きされます。
>
> - モード: **${mode === "production" ? "production" : "preview"}**
> - 生成: ${timestamp}
> - 設定ファイル: \`${path.relative(ROOT, configPath)}\`
> - 公開ドメイン: ${origin ? `\`${origin}\`` : "未設定"}
> - 公開ブロッカー: **${all.length}件**（未設定 ${missing.length} / 不整合 ${invalid.length}）
> - 警告: **${warnings.length}件**

## 公開ブロッカー

${table(all)}

## 警告

${table(warnings)}

## 公開前に人の確認が必要な項目

${manual.map((item) => `- [ ] ${item}`).join("\n")}

## 判定ルール

- \`null\` は未確認、\`false\` は未承認・未検証または初期無効です。
- 未確認の料金を \`0円\` として表示しません。
- 3窓口の接続確認・料金・運営情報・公開承認が揃わない限り、\`--production\` は失敗します。
- 公開用HTMLに \`確認中\`、\`プレビュー\`、\`TODO\`、\`TBD\`、テストURL・テスト電話番号が残る場合は失敗します。
- 自動チェックは、実接続・法務確認・本人同意・DNS・Search Console・広告設定の承認を代替しません。

## 設定の入力順（推奨）

1. \`operator\`（正式名称・所在地・責任者・問い合わせ先）
2. \`channels\`（AIはサーバー側API、LINE ID/URL、電話相談のLINE経由フロー、料金・受付時間・担当体制・\`verified\`）
3. \`pricing.items\` と \`pricing.total\`（金額・税区分・支払い・総額の注記）
4. \`service.scope\`・\`service.membershipConditions\`・\`service.cancellationRefundPolicy\`
5. \`staff\`（公開承認済みプロフィール）
6. \`legal\`（施行日・保存期間・削除方法・外部事業者）
7. \`publication\`（4つの承認フラグ）
8. \`canonicalOrigin\`・\`contentUpdatedAt\`

詳細は \`README.md\` と \`docs/LAUNCH-CHECKLIST.md\` を参照してください。
`;
}

async function main() {
  const args = parseArgs(process.argv);
  const mode = args.production ? "production" : "preview";
  const configPath = args.config ? path.resolve(args.config) : CONFIG_PATH;
  const config = await loadConfig(configPath);
  const issues = collectIssues(config);
  const origin = normalizeOrigin(config.canonicalOrigin);
  const outDir = args.out
    ? path.resolve(args.out)
    : path.join(DIST, mode === "production" ? "public" : "preview");
  const docsFile = args.docsOut ? path.resolve(args.docsOut) : path.join(ROOT, "docs", "PRELAUNCH.md");
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  await mkdir(path.dirname(docsFile), { recursive: true });
  await writeFile(
    docsFile,
    blockersMarkdown({ issues, mode, config, origin, timestamp, configPath }),
    "utf8",
  );

  if (mode === "production" && issues.blockers.length > 0) {
    console.error(`Production build stopped: ${issues.blockers.length} blocker(s).`);
    for (const entry of issues.blockers.slice(0, 24)) {
      console.error(`- [${entry.group}] ${entry.path}: ${entry.reason}`);
    }
    if (issues.blockers.length > 24) console.error(`- ...and ${issues.blockers.length - 24} more.`);
    console.error(`See ${path.relative(ROOT, docsFile)}. No files were written to the public output.`);
    if (await exists(outDir)) {
      console.error(
        `Warning: ${path.relative(ROOT, outDir)} already exists and was left untouched. Do not deploy stale output.`,
      );
    }
    process.exit(1);
  }

  const renderConfig = structuredClone(config);
  const lineQrSource = path.join(SRC, "assets", "line-qr.png");
  if (renderConfig.channels?.line && (await exists(lineQrSource))) {
    renderConfig.channels.line.qrAsset = "/assets/line-qr.png";
  }

  const pageRenderers = [
    renderHome({ config: renderConfig, mode }),
    renderAbout({ config: renderConfig, mode }),
    renderPrivacy({ config: renderConfig, mode }),
    renderTerms({ config: renderConfig, mode }),
    renderDisclosures({ config: renderConfig, mode }),
    renderNotFound({ config: renderConfig, mode }),
  ];

  const rendered = pageRenderers.map((page) => {
    const meta = buildMeta({ config, page, mode, origin });
    const jsonLd = buildJsonLd({ config, page, mode, origin });
    const metaTags = meta.tags;
    const html = layout({
      config,
      page: { ...page, metaTags },
      mode,
      origin,
      jsonLd,
      body: page.body,
      bodyClass: `page-${page.name}`,
    });
    return { ...page, html, meta };
  });

  if (mode === "production") {
    const problems = [];
    for (const page of rendered) {
      const hits = scanProductionText(page.html);
      if (hits.length > 0) problems.push(`${page.path}: ${hits.join(", ")}`);
      if (page.html.includes("data-preview-only")) problems.push(`${page.path}: data-preview-only が残っています`);
      if (page.html.includes('class="pending')) problems.push(`${page.path}: 未確認表示（pending）が残っています`);
    }
    if (problems.length > 0) {
      console.error("Production build stopped: output still contains preview or placeholder content.");
      for (const problem of problems) console.error(`- ${problem}`);
      process.exit(1);
    }
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const page of rendered) {
    const target = path.join(outDir, pageFile(page.path));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, page.html, "utf8");
  }

  const assetSource = path.join(SRC, "assets");
  const assetTarget = path.join(outDir, "assets");
  await mkdir(assetTarget, { recursive: true });
  const assetNames = [
    "styles.css",
    "app.js",
    "favicon.svg",
    "hero-illustration.jpg",
    "hero-illustration-1200.webp",
    "hero-illustration-720.webp",
    "consult-warm-illustration.jpg",
    "consult-warm-illustration-960.webp",
    "consult-warm-illustration-640.webp",
    "relax-healing-illustration.jpg",
    "relax-healing-illustration-1200.webp",
    "relax-healing-illustration-720.webp",
  ];
  for (const name of assetNames) {
    if (await exists(path.join(assetSource, name))) {
      await copyFile(path.join(assetSource, name), path.join(assetTarget, name));
    } else {
      console.warn(`Asset missing: src/assets/${name}`);
    }
  }
  for (const name of ["og-image.png", "apple-touch-icon.png"]) {
    if (await exists(path.join(assetSource, name))) {
      await copyFile(path.join(assetSource, name), path.join(assetTarget, name));
    } else {
      console.warn(`Asset missing: src/assets/${name} (OGP / Apple touch icon)`);
    }
  }
  const fontsSource = path.join(assetSource, "fonts");
  if (await exists(fontsSource)) {
    await cp(fontsSource, path.join(assetTarget, "fonts"), { recursive: true });
  } else {
    console.warn("Asset missing: src/assets/fonts");
  }
  if (await exists(lineQrSource)) {
    await copyFile(lineQrSource, path.join(assetTarget, "line-qr.png"));
  }

  if (mode === "production") {
    await writeFile(
      path.join(outDir, "robots.txt"),
      `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
      "utf8",
    );
    await writeFile(
      path.join(outDir, "sitemap.xml"),
      sitemapXml(rendered, origin, config.contentUpdatedAt),
      "utf8",
    );
  } else {
    await writeFile(path.join(outDir, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8");
  }

  await writeFile(path.join(outDir, "_headers"), headersFile(), "utf8");

  const pageList = rendered.map((page) => page.path).join(", ");
  console.log(`${mode === "production" ? "Production" : "Preview"} build: ${path.relative(ROOT, outDir)}`);
  console.log(`Pages (${rendered.length}): ${pageList}`);
  console.log(
    `Blockers: ${issues.blockers.length} / warnings: ${issues.warnings.length} (${path.relative(ROOT, docsFile).replaceAll("\\", "/")})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
