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

function sitemapPriority(route) {
  if (route === "/") return { changefreq: "weekly", priority: "1.0" };
  if (route === "/about/" || route === "/disclosures/") return { changefreq: "monthly", priority: "0.8" };
  return { changefreq: "monthly", priority: "0.6" };
}

function sitemapXml(pages, origin, lastmod) {
  const urls = pages
    .filter((page) => !page.noindex && page.path !== "/404.html")
    .map((page) => {
      const { changefreq, priority } = sitemapPriority(page.path);
      const imagesXml = Array.isArray(page.images)
        ? page.images
            .map(
              (img) => `    <image:image>
      <image:loc>${escapeXml(origin + img.path)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`,
            )
            .join("\n")
        : "";
      return [
        "  <url>",
        `    <loc>${escapeXml(origin + page.path)}</loc>`,
        lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        imagesXml,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}

function manifestJson(config) {
  return `${JSON.stringify(
    {
      name: `${config.brandName}｜保育士の退職代行・お悩み相談`,
      short_name: config.brandName,
      description:
        "元保育士と女性カウンセラーが対応する、保育士特化の無料お悩み相談・労働組合運営の退職代行サービス。",
      lang: "ja",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#FAF6F0",
      theme_color: "#1D6258",
      icons: [
        {
          src: "/assets/favicon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
        {
          src: "/assets/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
          purpose: "any",
        },
      ],
    },
    null,
    2,
  )}\n`;
}

function llmsTxt(config, origin) {
  const operator = config.operator ?? {};
  const lineUrl = config.channels?.line?.url || "";
  const lineId = config.channels?.line?.id || "";
  return `# ${config.brandName}｜「保育士 辞めたい」「保育士 退職代行」特化の労働組合運営・無料相談窓口

> 「保育士を辞めたいけれど園長が怖くて言い出せない」「年度途中の担任引き継ぎが気になり一歩を踏み出せない」と悩む保育士さんのための、保育士特化の退職代行・無料お悩み相談サービス【${config.brandName}】。元保育士スタッフと女性カウンセラーが24時間LINE・電話で無料相談に対応し、労働組合運営（公立保育園は提携弁護士対応）の退職代行で園や保護者と直接やり取りすることなく郵送完結で退職をサポートします。

## 対象キーワード・解決するお悩み（「保育士 辞めたい」「保育士 退職代行」）
- **「保育士 辞めたい」と悩む方へ**:
  - 行事や運動会、連絡帳・持ち帰り残業のプレッシャーで夜も眠れない
  - 先輩や園長からの当たりが強く、辞めたいと言い出せない
  - 子どもや保護者のことを考えると罪悪感で動けない
  - 年度途中や1年目・担任の引き継ぎが気になり、言い出す時期がわからない
  - 「まだ辞めるべきか迷っている」「まずは誰かに話を聞いてほしい」段階から完全無料でLINE相談可能
- **「保育士 退職代行」をお探しの方へ**:
  - 団体交渉権を持つ**労働組合運営**のため、園への退職連絡・退職日や有給消化等の調整を適法に代行
  - **公立保育園（公務員保育士）**は提携弁護士が対応するため、地方公務員法上の手続きも万全
  - 退職届の提出や保険証・エプロン等の貸与物返却、私物の引き取りまですべて**郵送で完結**（園へ足を運ぶ必要なし）

## サービス概要
- **サービス名**: ${config.brandName}
- **運営主体**: ${operator.legalName || config.brandName}（労働組合運営）
- **対象者**: ${config.service?.audience || "退職を考えている保育士（正社員・契約社員・パート・公立保育士等）"}
- **相談料**: AIチャット・LINE相談・電話相談すべて完全無料（0円）
- **受付時間**: 24時間受付・秘密厳守・「辞めるか迷っている段階」の相談も歓迎
- **公式URL**: ${origin}/
${lineUrl ? `- **公式LINE**: ${lineUrl} （ID: ${lineId}）\n` : ""}
## 選ばれる4つの理由
1. **保育の現場を知る「元保育士」が親身に相談対応**: 行事準備や持ち帰り残業、担任・引き継ぎの悩みも専門用語のまま伝わります。
2. **女性カウンセラー在籍で安心して話せる**: 威圧的な対応が苦手な方でも優しく気持ちを整理できます。
3. **「退職ありき」ではない優しい相談フェーズ**: 退職を無理に勧めることはありません。
4. **労働組合提携＆公立保育士は弁護士対応で安心**: 退職届の郵送や貸与物の返却までサポートし、園への直接連絡は不要です。

## 料金プラン（税込・追加料金なし・全額返金保証・あと払い対応）
- **無料相談（LINE・電話・保育特化AIチャット）**: 0円
- **20代・就業6年以内限定プラン（若手支援特別価格）**: 24,800円（税込）— 退職連絡・組合費込み／追加料金なし
- **通常プラン**: 28,000円（税込）— 正社員・契約社員・パート等すべて対応
- **公務員（公立保育園）プラン**: 75,000円（税込）— 提携弁護士が対応／公立園の手続き一式

## ご利用の流れ（かんたん3ステップ）
1. **STEP 01 公式LINEを友だち追加**: 無料・24時間受付。まずは相談だけでもOK。
2. **STEP 02 ヒアリングシート（Googleフォーム）を記入**: スマホ完結。長い電話ヒアリングは不要。
3. **STEP 03 料金のお支払いでご依頼完了**: クレジットカード（Square決済）・あと払い対応。お支払い後は当組合（公立は提携弁護士）が園への連絡・調整をすべて代行します。

## 主要ページ一覧
- [トップページ](${origin}/): 保育士が辞めたい時の無料相談・退職代行の特徴、LINE相談イメージ、料金プラン、ご利用の流れ、AIチャット相談、よくあるご質問
- [運営情報・労働組合について](${origin}/about/): 運営する労働組合、元保育士スタッフ・女性カウンセラーの相談体制、対応範囲
- [取引条件・事業者情報](${origin}/disclosures/): 特定商取引法等に基づく表記、料金内訳、支払方法・時期、取消・返金条件
- [利用条件](${origin}/terms/): 相談と正式依頼の違い、組合加入条件、免責事項
- [個人情報・相談情報の取扱い](${origin}/privacy/): プライバシーポリシー、AI・LINE・電話相談データの保護方針
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
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Permitted-Cross-Domain-Policies: none
  Content-Security-Policy: frame-ancestors 'none'

/404.html
  X-Robots-Tag: noindex, nofollow

/api/*
  X-Robots-Tag: noindex, nofollow

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

  await writeFile(path.join(outDir, "manifest.webmanifest"), manifestJson(config), "utf8");

  if (mode === "production") {
    await writeFile(
      path.join(outDir, "robots.txt"),
      `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
      "utf8",
    );
    await writeFile(
      path.join(outDir, "sitemap.xml"),
      sitemapXml(rendered, origin, config.contentUpdatedAt),
      "utf8",
    );
    await writeFile(path.join(outDir, "llms.txt"), llmsTxt(config, origin), "utf8");
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
