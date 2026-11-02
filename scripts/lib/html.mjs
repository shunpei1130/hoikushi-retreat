const HTML_ESCAPE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => HTML_ESCAPE[character]);
}

export function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

export function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

export function formatAmount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  return `${new Intl.NumberFormat("ja-JP").format(amount)}円`;
}

export function formatDateJa(isoDate) {
  if (typeof isoDate !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

export function pending(text = "確認中", extraClass = "") {
  const className = ["pending", extraClass].filter(Boolean).join(" ");
  return `<span class="${className}"><span class="pending__mark" aria-hidden="true"></span>${escapeHtml(text)}<span class="sr-only">（公開前に運営の承認を得て確定します）</span></span>`;
}

export function pendingInline(label = "確認中") {
  return `<span class="pending pending--inline"><span class="pending__mark" aria-hidden="true"></span>${escapeHtml(label)}<span class="sr-only">（公開前に運営の承認を得て確定します）</span></span>`;
}

export function orPending(value, formatter = escapeHtml, label = "確認中") {
  if (value === null || value === undefined || value === "") return pending(label);
  return formatter(value);
}

export function safeJsonLd(data) {
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}
