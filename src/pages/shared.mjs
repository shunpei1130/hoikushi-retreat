import { escapeHtml, formatDateJa, pending } from "../../scripts/lib/html.mjs";
import { icon } from "../../scripts/lib/icons.mjs";

export function pageHero({ eyebrow, title, lead, breadcrumbs, meta }) {
  return `<section class="page-hero">
    <div class="container page-hero__inner">
      <nav class="breadcrumbs" aria-label="パンくずリスト">
        <ol>
          ${breadcrumbs
            .map((item, index) => {
              const last = index === breadcrumbs.length - 1;
              if (last) return `<li aria-current="page">${escapeHtml(item.label)}</li>`;
              return `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.label)}</a></li>`;
            })
            .join("")}
        </ol>
      </nav>
      <p class="eyebrow"><span class="eyebrow__rule" aria-hidden="true"></span><span class="eyebrow__label">${escapeHtml(eyebrow)}</span></p>
      <h1>${title}</h1>
      <p class="page-hero__lead">${lead}</p>
      ${meta ? `<p class="page-hero__meta">${meta}</p>` : ""}
    </div>
  </section>`;
}

export function pageLayout({ toc, body, updatedAt, preview = false }) {
  const updated = updatedAt
    ? escapeHtml(formatDateJa(updatedAt) || updatedAt)
    : pending("更新日：確認中");
  return `<div class="container page-layout">
    <aside class="page-aside">
      <nav class="page-toc" aria-label="このページの目次">
        <p class="page-toc__title">目次</p>
        <ol>
          ${toc.map((item) => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`).join("")}
        </ol>
      </nav>
      <div class="page-aside__note">
        <p class="page-aside__kicker">OPERATOR</p>
        <p>運営主体や連絡先は<a href="/about/">運営情報</a>に掲載しています。</p>
      </div>
      <p class="page-updated">更新日：${updated}</p>
      ${preview ? `<p class="page-preview-note">${icon("info")} 公開前のレビュー用ページです。未確認の条件は「確認中」と表示しています。</p>` : ""}
    </aside>
    <article class="prose">
      ${body}
    </article>
  </div>`;
}

export function h2(id, text) {
  return `<h2 id="${escapeHtml(id)}">${escapeHtml(text)}</h2>`;
}

export function policyTable(rows) {
  return `<dl class="policy-facts">
    ${rows
      .map(
        ([label, value]) => `<div class="policy-facts__row">
          <dt>${escapeHtml(label)}</dt>
          <dd>${value === null || value === undefined || value === "" ? pending() : value}</dd>
        </div>`,
      )
      .join("")}
  </dl>`;
}

export function callout(text, { tone = "soft", title = null } = {}) {
  return `<div class="callout callout--${tone}">
    <span class="callout__icon">${icon("info")}</span>
    <div>${title ? `<p class="callout__title">${escapeHtml(title)}</p>` : ""}<p>${text}</p></div>
  </div>`;
}

export function bulletList(items) {
  return `<ul class="prose-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

export function numberedList(items) {
  return `<ol class="prose-list prose-list--ordered">${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
}
