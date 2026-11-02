import { escapeHtml, formatAmount, formatDateJa, pending, pendingInline } from "./html.mjs";
import { icon } from "./icons.mjs";

export const CHANNEL_META = {
  ai: {
    short: "AIチャット",
    full: "保育特化AIにチャットで聞く",
    cardTitle: "保育特化AIにチャットで聞く",
    role: "AI（自動応答）",
    icon: "ai",
    placementNote: "OpenAI APIの接続確認は公開前に行います",
    pendingNote: "APIキー設定後にチャットを利用できます",
  },
  line: {
    short: "LINE相談",
    full: "元保育士にLINEで相談する",
    cardTitle: "元保育士にLINEで相談する",
    role: "元保育士",
    icon: "chat",
    placementNote: "LINE IDはご提供情報です。動作確認は公開前に行います",
    pendingNote: "LINE公式アカウントの動作確認は公開前に行います",
  },
  phone: {
    short: "電話相談",
    full: "元保育士に電話で相談する",
    cardTitle: "元保育士に電話で相談する",
    role: "元保育士",
    icon: "phone",
    placementNote: "LINE追加後、「電話相談希望」と送信してください",
    pendingNote: "LINEを追加して電話相談希望を送信してください",
  },
};

export function channelLabel(config, key, variant = "full") {
  if (key === "phone" && config.channels?.phone?.requestViaLine === true) {
    return variant === "short" ? "電話相談" : "LINEで電話相談を希望する";
  }
  if (key === "phone" && config.channels?.phone?.reservationRequired === true) {
    return variant === "short" ? "電話予約" : "元保育士との電話相談を予約する";
  }
  return variant === "short" ? CHANNEL_META[key].short : CHANNEL_META[key].full;
}

export function channelCardTitle(config, key) {
  if (key === "phone" && config.channels?.phone?.reservationRequired === true) {
    return "元保育士との電話相談を予約する";
  }
  return CHANNEL_META[key].cardTitle;
}

export function channelProcess(config, key) {
  const channel = config.channels?.[key] ?? {};
  if (key === "ai") return CHANNEL_META.ai.role;
  return channel.formerChildcareWorkerProcess || CHANNEL_META[key].role;
}

export function channelStatus(config, key, mode = "production") {
  const channel = config.channels?.[key] ?? {};
  if (key === "ai") {
    return {
      available: true,
      href: "#ai-chat",
      external: false,
      requiresReview: channel.verified !== true,
    };
  }
  if (key === "line") {
    const configured = typeof channel.url === "string" && channel.url.startsWith("https://");
    const available = configured && (mode === "preview" || channel.verified === true);
    return {
      available,
      href: available ? channel.url : null,
      external: true,
      requiresReview: channel.verified !== true,
    };
  }
  if (key === "phone") {
    if (channel.requestViaLine === true) {
      const requestUrl = channel.requestUrl;
      const lineVerified = config.channels?.line?.verified === true;
      const configured = typeof requestUrl === "string" && requestUrl.startsWith("https://");
      const available = configured && (mode === "preview" || (channel.verified === true && lineVerified));
      return {
        available,
        href: available ? requestUrl : null,
        external: true,
        requiresReview: channel.verified !== true || !lineVerified,
      };
    }
    const available = channel.verified === true && typeof channel.number === "string" && channel.number.trim().length > 0;
    return {
      available,
      href: available ? `tel:${channel.number.replace(/[^\d+]/g, "")}` : null,
      external: false,
      requiresReview: channel.verified !== true,
    };
  }
  throw new Error(`Unknown channel: ${key}`);
}

export function channelButton(config, key, options = {}) {
  const {
    mode = "preview",
    placement = "body",
    label = channelLabel(config, key),
    variant = "outline",
    className = "",
    showIcon = true,
    showNote = true,
  } = options;
  const status = channelStatus(config, key, mode);
  const meta = CHANNEL_META[key];
  const classes = ["button", `button--${variant}`, className].filter(Boolean).join(" ");
  const iconHtml = showIcon ? `<span class="button__icon">${icon(meta.icon)}</span>` : "";
  const arrowHtml = status.available ? `<span class="button__arrow">${icon("arrowRight")}</span>` : "";
  const noteHtml = !status.available && showNote ? `<span class="button__pending-note">${escapeHtml(meta.placementNote)}</span>` : "";

  if (status.available) {
    const externalAttrs = status.external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const reviewNote = status.requiresReview && mode === "preview" && showNote
      ? `<span class="button__pending-note">${escapeHtml(meta.placementNote)}</span>`
      : "";
    return `<a class="${classes}" href="${escapeHtml(status.href)}" data-track="consult_cta_click" data-channel="${key}" data-placement="${escapeHtml(placement)}"${externalAttrs}>${iconHtml}<span class="button__label">${escapeHtml(label)}</span>${arrowHtml}${reviewNote}</a>`;
  }

  return `<span class="${classes} button--pending" aria-disabled="true" data-channel="${key}" data-placement="${escapeHtml(placement)}">${iconHtml}<span class="button__label">${escapeHtml(label)}</span>${noteHtml}</span>`;
}

export function sectionHead({ number, eyebrow, title, lead, id, align = "left" }) {
  return `<div class="section-head section-head--${align}">
  <p class="eyebrow"><span class="eyebrow__num">${escapeHtml(number)}</span><span class="eyebrow__label">${escapeHtml(eyebrow)}</span></p>
  <h2 id="${escapeHtml(id)}">${title}</h2>
  ${lead ? `<p class="section-lead">${lead}</p>` : ""}
</div>`;
}

export function navLink(href, label, current = false) {
  return `<a href="${escapeHtml(href)}"${current ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
}

export function breadcrumbs(items, origin = null) {
  return `<nav class="breadcrumbs" aria-label="パンくずリスト">
    <ol>
      ${items
        .map((item, index) => {
          const last = index === items.length - 1;
          const href = origin && item.path ? `${origin}${item.path}` : item.path;
          if (last) return `<li aria-current="page">${escapeHtml(item.label)}</li>`;
          return `<li><a href="${escapeHtml(href)}">${escapeHtml(item.label)}</a></li>`;
        })
        .join("")}
    </ol>
  </nav>`;
}

export function operatorFacts(config, mode) {
  const operator = config.operator ?? {};
  const rows = [
    ["正式名称", operator.legalName, "労働組合の正式名称"],
    ["所在地", operator.address, "所在地"],
    ["責任者", operator.responsiblePerson, "責任者"],
    ["問い合わせ先", operator.contact, "問い合わせ先"],
    ["受付時間", operator.hours, "受付時間"],
  ];

  return `<dl class="facts">
    ${rows
      .map(([label, value, pendingLabel]) => {
        let valueHtml;
        if (value) {
          valueHtml = escapeHtml(value);
          if (label === "問い合わせ先" && operator.contactUrl) {
            valueHtml = `<a href="${escapeHtml(operator.contactUrl)}" target="_blank" rel="noopener noreferrer">${valueHtml}</a>`;
          }
        } else {
          valueHtml = pending(mode === "production" ? "未設定" : "確認中", "pending--soft");
        }
        return `<div class="facts__row"><dt>${escapeHtml(label)}</dt><dd>${valueHtml}<span class="facts__note">${escapeHtml(pendingLabel)}</span></dd></div>`;
      })
      .join("")}
  </dl>`;
}

export function staffCards(config, mode) {
  const people = Array.isArray(config.staff) ? config.staff.filter((person) => person.approved === true) : [];
  if (people.length === 0) {
    return `<article class="staff-card staff-card--pending" aria-label="スタッフ情報（公開前に確定）">
      <div class="staff-card__top">
        <div class="staff-avatar" aria-hidden="true">${icon("users")}</div>
        <div>
          <p class="staff-card__kicker">STAFF PROFILE</p>
          <h3>スタッフ情報は公開前に確定します</h3>
        </div>
      </div>
      <p class="staff-card__body">氏名・勤務経験・担当する相談窓口・プロフィール更新日は、本人の確認と掲載許可を得た情報だけを掲載します。公開までに、実際に相談を担当するスタッフの情報を掲載します。</p>
      <p class="staff-card__meta">${pending("プロフィール確認中")}</p>
    </article>`;
  }

  return people
    .map((person) => {
      const channels = Array.isArray(person.channels)
        ? person.channels.map((channel) => CHANNEL_META[channel]?.short || channel).join("・")
        : "";
      const monogram = person.name ? person.name.trim().slice(0, 1) : "保";
      return `<article class="staff-card">
        <div class="staff-card__top">
          <div class="staff-avatar staff-avatar--named" aria-hidden="true">${escapeHtml(monogram)}</div>
          <div>
            <p class="staff-card__kicker">STAFF PROFILE</p>
            <h3>${escapeHtml(person.name)}</h3>
            <p class="staff-card__role">${escapeHtml(person.role || "元保育士スタッフ")}</p>
          </div>
        </div>
        <p class="staff-card__experience">${escapeHtml(person.experience)}</p>
        <p class="staff-card__body">${escapeHtml(person.message)}</p>
        <div class="staff-card__footer">
          <span>担当：${escapeHtml(channels)}</span>
          <span>更新：${escapeHtml(formatDateJa(person.updatedAt) || person.updatedAt)}</span>
        </div>
      </article>`;
    })
    .join("");
}

export function priceValue(item, mode) {
  if (!item) return pending();
  if (item.verified === true && typeof item.amount === "number") {
    return `<span class="price-value">${escapeHtml(formatAmount(item.amount))}${item.unit ? `<small>${escapeHtml(item.unit)}</small>` : ""}</span>`;
  }
  return pending(mode === "production" ? "未設定" : "確認中");
}

export function taxSuffix(config) {
  if (config.pricing?.taxStatus === "included") return "（税込）";
  if (config.pricing?.taxStatus === "excluded") return "（税別）";
  if (config.pricing?.taxStatus === "mixed") return "（税区分は費目ごと）";
  return "";
}

export function computeTotal(config) {
  const items = Array.isArray(config.pricing?.items) ? config.pricing.items : [];
  const ids = Array.isArray(config.pricing?.total?.componentIds) ? config.pricing.total.componentIds : [];
  const components = ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
  const fixedAmount = config.pricing?.total?.fixedAmount;
  if (
    config.pricing?.total?.verified === true &&
    typeof fixedAmount === "number" &&
    Number.isFinite(fixedAmount) &&
    fixedAmount >= 0
  ) {
    return { amount: fixedAmount, components, fixed: true };
  }
  const allReady =
    config.pricing?.total?.verified === true &&
    components.length === ids.length &&
    ids.length > 0 &&
    components.every((item) => item.verified === true && typeof item.amount === "number");

  if (!allReady) return { amount: null, components, fixed: false };
  return { amount: components.reduce((sum, item) => sum + item.amount, 0), components, fixed: false };
}

export function totalValue(config, mode, className = "") {
  const { amount } = computeTotal(config);
  if (amount === null) return `<span class="${className}">${pending(mode === "production" ? "未設定" : "確認中")}</span>`;
  return `<span class="total-value ${className}">${escapeHtml(formatAmount(amount))}<small>${escapeHtml(taxSuffix(config))}</small></span>`;
}

export function channelFee(config, key) {
  const channel = config.channels?.[key] ?? {};
  const value =
    key === "ai" ? channel.feeDisclosure : key === "line" ? channel.feeDisclosure : channel.consultationFeeDisclosure;
  return value ? escapeHtml(value) : pending();
}

export function channelHours(config, key) {
  const channel = config.channels?.[key] ?? {};
  if (key === "line") {
    const parts = [];
    if (channel.acceptanceHours) parts.push(`送信受付 ${channel.acceptanceHours}`);
    if (channel.replyHours) parts.push(`返信 ${channel.replyHours}`);
    return parts.length ? escapeHtml(parts.join(" / ")) : pending();
  }
  const value = key === "ai" ? channel.hoursDisclosure : channel.hours;
  return value ? escapeHtml(value) : pending();
}

export function inlineOrPending(value, label = "確認中") {
  return value ? escapeHtml(value) : pendingInline(label);
}

export function guidePlaceholder() {
  return "";
}

export function externalLink(href, label, className = "") {
  return `<a class="text-link ${className}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}${icon("external")}</a>`;
}
