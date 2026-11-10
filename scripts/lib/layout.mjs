import { createHash } from "node:crypto";
import { escapeAttr, escapeHtml, safeJsonLd } from "./html.mjs";
import { brandMark, icon } from "./icons.mjs";
import { channelButton, channelLabel } from "./components.mjs";

function buildCsp(jsonLdText) {
  const hash = createHash("sha256").update(jsonLdText, "utf8").digest("base64");
  return [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "img-src 'self' data:",
    "font-src 'self'",
    "style-src 'self'",
    "script-src 'self' 'sha256-" + hash + "'",
    "connect-src 'self'",
    "manifest-src 'self'",
  ].join("; ");
}

function header(config, page) {
  const isHome = page.path === "/";
  const anchor = (hash) => (isHome ? hash : `/${hash}`);
  const aboutCurrent = page.path === "/about/";
  return `<header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="/" aria-label="${escapeAttr(config.brandName)} トップページ">
        ${brandMark()}
        <span class="brand__text">
          <span class="brand__name">${escapeHtml(config.brandName)}</span>
          <span class="brand__kicker">労働組合運営</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="主なメニュー">
        <a href="${anchor("#worries")}">お悩み</a>
        <a href="${anchor("#talk")}">LINE相談</a>
        <a href="${anchor("#reasons")}">選ばれる理由</a>
        <a href="${anchor("#pricing")}">料金プラン</a>
        <a href="${anchor("#flow")}">ご利用の流れ</a>
        <a href="${anchor("#faq")}">よくある質問</a>
        <a href="/about/"${aboutCurrent ? ' aria-current="page"' : ""}>運営情報</a>
      </nav>
      <a class="header-action" href="${anchor("#talk")}">
        <span class="header-action__long">無料相談をはじめる</span>
        <span class="header-action__short">無料相談</span>
        ${icon("arrowRight")}
      </a>
    </div>
  </header>`;
}

function stickyCta(config, page, mode) {
  if (!page.stickyCta) return "";
  return `<div class="sticky-cta" data-sticky-cta hidden>
    <div class="sticky-cta__inner" aria-label="LINEで無料相談">
      <p class="sticky-cta__lead"><strong>相談料 0円</strong><span>秘密厳守・24時間受付</span></p>
      ${channelButton(config, "line", {
        mode,
        placement: "sticky",
        label: "LINEで無料相談する",
        variant: "sticky-primary",
        showIcon: true,
        showNote: false,
      })}
    </div>
  </div>`;
}

function previewStatus(config) {
  const operator = config.operator ?? {};
  return `<section class="preview-status" id="preview-status" aria-labelledby="preview-status-title" data-preview-only>
    <div class="preview-status__head">
      <p class="preview-status__kicker">PREVIEW CHECKLIST</p>
      <h2 id="preview-status-title">公開前に確認する項目</h2>
    </div>
    <div class="preview-status__body">
      <p>このページはレビュー用のプレビューです。次の項目は未確認のため、公開用ビルドでは停止します。</p>
      <ul class="preview-status__list">
        <li>労働組合の正式名称・所在地・責任者・問い合わせ先</li>
        <li>AIチャットのAPI接続・モデル・利用条件・データ取扱い</li>
        <li>LINE公式アカウントID・返信時間・担当体制</li>
        <li>LINE追加後の電話相談フロー・受付時間・通話料</li>
        <li>退職代行の税込総額・内訳・支払い・取消条件</li>
        <li>元保育士スタッフの氏名・経歴・担当窓口・掲載許可</li>
        <li>個人情報の保存期間・削除方法・外部サービスの提供事業者</li>
        <li>公開ドメイン・canonical・各公開承認</li>
      </ul>
      <p class="preview-status__note">未確認の料金を0円として表示したり、未接続の窓口を稼働中として見せたりすることはありません。</p>
    </div>
  </section>`;
}

function footer(config, page, mode) {
  const isHome = page.path === "/";
  const anchor = (hash) => (isHome ? hash : `/${hash}`);
  const operator = config.operator ?? {};
  const operatorName = operator.legalName ? escapeHtml(operator.legalName) : "労働組合（正式名称は公開前に確定）";
  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-main">
        <div class="footer-brand">
          <a class="brand brand--footer" href="/" aria-label="${escapeAttr(config.brandName)} トップページ">
            ${brandMark()}
            <span class="brand__text">
              <span class="brand__name">${escapeHtml(config.brandName)}</span>
              <span class="brand__kicker">労働組合運営</span>
            </span>
          </a>
          <p class="footer-brand__copy">保育の事情を話せる相談窓口から、<br>組合による退職支援まで。</p>
          <p class="footer-brand__operator">運営：${operatorName}</p>
        </div>
        <nav class="footer-col" aria-label="相談方法">
          <h2>相談方法・お悩みガイド</h2>
          <a href="${anchor("#talk")}">LINE相談のイメージ</a>
          <a href="${anchor("#pricing")}">料金プラン</a>
          <a href="${anchor("#flow")}">ご利用の流れ</a>
          <a href="${anchor("#faq")}">よくあるご質問</a>
          <a href="/yametai/">保育士を辞めたい方へ</a>
          <a href="/taishoku-daikou/">保育士の退職代行ガイド</a>
        </nav>
        <nav class="footer-col" aria-label="運営情報">
          <h2>運営情報</h2>
          <a href="/about/">組合・運営体制</a>
          <a href="/terms/">利用条件</a>
          <a href="/disclosures/">取引条件・事業者情報</a>
          <a href="/privacy/">個人情報の取扱い</a>
        </nav>
        <div class="footer-col footer-col--contact">
          <h2>お問い合わせ</h2>
          <p>${operator.contact ? escapeHtml(operator.contact) : "問い合わせ先は公開前に確定します。"}</p>
          <p>${operator.hours ? escapeHtml(operator.hours) : "受付時間は公開前に確定します。"}</p>
          <a class="footer-contact-link" href="${anchor("#consult")}">相談方法を見る ${icon("arrowRight")}</a>
        </div>
      </div>
      ${mode === "preview" ? previewStatus(config) : ""}
      <div class="footer-bottom">
        <p>© 2026 ${escapeHtml(config.brandName)}</p>
        <p class="footer-bottom__note">${mode === "preview" ? "プレビュー版・公開前" : "労働組合運営"}</p>
      </div>
    </div>
  </footer>`;
}

export function layout({
  config,
  page,
  mode,
  origin,
  jsonLd,
  body,
  bodyClass = "",
}) {
  const jsonLdText = safeJsonLd(jsonLd);
  const csp = buildCsp(jsonLdText);
  const isProduction = mode === "production";
  const content = body;

  return `<!doctype html>
<html lang="ja" data-mode="${mode}" data-analytics="${config.analytics?.enabled === true ? "enabled" : "disabled"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${escapeAttr(csp)}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#1D6258">
  ${page.metaTags}
  <link rel="icon" href="/favicon.ico" sizes="32x32 48x48">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  ${page.name === "home" ? '<link rel="preload" as="image" href="/assets/hero-illustration-1200.webp" imagesrcset="/assets/hero-illustration-720.webp 720w, /assets/hero-illustration-1200.webp 1200w" imagesizes="(max-width: 980px) 92vw, 480px" type="image/webp" fetchpriority="high">' : ""}
  <link rel="stylesheet" href="/assets/fonts/kiwi-maru.css">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="application/ld+json">${jsonLdText}</script>
</head>
<body class="${escapeAttr(bodyClass)}" data-page="${escapeAttr(page.name || "")}">
  <a class="skip-link" href="#main">本文へ移動</a>
  ${isProduction ? "" : `<div class="preview-bar" role="note" data-preview-only>
    <div class="container preview-bar__inner">
      <p><strong>プレビュー版</strong><span class="preview-bar__long">料金・連絡先・運営者の正式情報など、公開前に確認が必要な項目があります。</span><span class="preview-bar__short">公開前に確認する項目があります。</span></p>
      <a href="#preview-status">確認事項</a>
    </div>
  </div>`}
  ${header(config, page)}
  <main id="main" tabindex="-1">
    ${content}
  </main>
  ${footer(config, page, mode)}
  ${stickyCta(config, page, mode)}
  <script src="/assets/app.js" defer></script>
</body>
</html>`;
}
