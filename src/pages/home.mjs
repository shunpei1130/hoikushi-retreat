import { escapeHtml, formatAmount, pending, pendingInline } from "../../scripts/lib/html.mjs";
import { icon } from "../../scripts/lib/icons.mjs";
import {
  CHANNEL_META,
  channelButton,
  channelCardTitle,
  channelFee,
  channelHours,
  channelLabel,
  channelProcess,
  channelStatus,
  priceValue,
  sectionHead,
  staffCards,
  totalValue,
} from "../../scripts/lib/components.mjs";

const HOME_TITLE = "保育士の退職代行｜元保育士にLINE・電話相談｜リトリート";
const HOME_DESCRIPTION =
  "保育士の退職相談・退職代行を労働組合がサポート。保育特化AIへのチャット、元保育士へのLINE・電話相談から、話しやすい方法を選べます。料金・対応範囲・ご利用の流れをご案内します。";

function item(config, id) {
  return (config.pricing?.items || []).find((entry) => entry.id === id);
}

function heroFee(config, key) {
  const channel = config.channels?.[key] ?? {};
  const value =
    key === "ai"
      ? channel.feeDisclosure
      : key === "line"
        ? channel.feeDisclosure
        : channel.consultationFeeDisclosure;
  return value ? escapeHtml(value) : "費用 確認中";
}

function heroMethodCard(config, key, mode) {
  const meta = CHANNEL_META[key];
  const status = channelStatus(config, key, mode);
  const number = key === "ai" ? "01" : key === "line" ? "02" : "03";
  const label = key === "ai" ? "AI CHAT" : key === "line" ? "LINE" : "PHONE";
  const inner = `<span class="method-card__top">
      <span class="method-card__icon">${icon(meta.icon)}</span>
      <span class="method-card__tag">${number} / ${label}</span>
    </span>
    <span class="method-card__title">${escapeHtml(channelCardTitle(config, key))}</span>
    <span class="method-card__sub">${escapeHtml(
      key === "ai"
        ? "まずは質問や気持ちを整理したい方へ"
        : key === "line"
          ? "文字で自分の状況を伝えたい方へ"
          : config.channels?.phone?.requestViaLine === true
            ? "LINE追加後、「電話相談希望」と送信してください"
            : "声で話しながら相談したい方へ",
    )}</span>
    <span class="method-card__meta"><span>${escapeHtml(meta.role)}</span><span class="dot" aria-hidden="true"></span><span>${heroFee(config, key)}</span></span>`;

  if (status.available) {
    const externalAttrs = status.external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const needsReview = status.requiresReview && mode === "preview";
    const reviewNote = needsReview
      ? `<span class="method-card__pending">${escapeHtml(meta.placementNote)}</span>`
      : "";
    return `<a class="method-card method-card--${key}${needsReview ? " method-card--review" : ""}" href="${escapeHtml(status.href)}" data-track="consult_cta_click" data-channel="${key}" data-placement="hero"${externalAttrs}>
      ${inner}
      <span class="method-card__arrow">${icon("arrowRight")}</span>
      ${reviewNote}
    </a>`;
  }

  return `<div class="method-card method-card--${key} method-card--pending" aria-disabled="true" data-channel="${key}" data-placement="hero">
    ${inner}
    <span class="method-card__pending">${escapeHtml(meta.placementNote)}</span>
  </div>`;
}

function comparisonCard(config, key, mode) {
  const meta = CHANNEL_META[key];
  const channel = config.channels?.[key] ?? {};
  const audience =
    key === "ai"
      ? "まずは質問や気持ちを整理したい方へ"
      : key === "line"
        ? "文字で自分の状況を伝えたい方へ"
        : "声で話しながら相談したい方へ";
  const connection =
    key === "ai"
      ? channel.provider || null
      : key === "line"
        ? channel.accountName || channel.id || null
        : channel.requestViaLine === true
          ? config.channels?.line?.id || null
          : channel.number || null;
  const connectionLabel =
    key === "ai" ? "提供" : key === "line" ? "公式アカウント / ID" : channel.requestViaLine === true ? "LINE受付ID" : "電話番号";
  const aiAccount =
    channel.requiresAccount === true ? "必要" : channel.requiresAccount === false ? "不要" : pending();
  const phoneReservation =
    channel.reservationRequired === true
      ? "必要（予約制）"
      : channel.reservationRequired === false
        ? "不要"
        : pending();
  const extraFacts =
    key === "ai"
      ? `<div><dt>ログイン</dt><dd>${aiAccount}</dd></div>`
      : key === "phone"
        ? channel.requestViaLine === true
          ? `<div><dt>相談の始め方</dt><dd>LINEで希望を送信</dd></div>
      <div><dt>通話料</dt><dd>${channel.callChargeDisclosure ? escapeHtml(channel.callChargeDisclosure) : pending()}</dd></div>`
          : `<div><dt>予約</dt><dd>${phoneReservation}</dd></div>
      <div><dt>通話料</dt><dd>${channel.callChargeDisclosure ? escapeHtml(channel.callChargeDisclosure) : pending()}</dd></div>`
        : "";
  const phoneNote =
    channel.requestViaLine === true
      ? "電話相談をご希望の場合は、LINE追加後に「電話相談希望」と送信してください。返信で進め方をご案内します。相談料は無料。通話料等は別途確認中です。"
      : channel.reservationRequired === true
      ? "予約制です。予約のうえ発信してください。相談料と通話料は別です。"
      : channel.reservationRequired === false
        ? "予約は不要です。相談料と通話料は別です。"
        : "予約の要否と通話料を確認したうえで発信できます。相談料と通話料は別です。";

  return `<article class="compare-card compare-card--${key}" aria-labelledby="compare-${key}">
    <div class="compare-card__head">
      <span class="compare-card__icon">${icon(meta.icon)}</span>
      <div>
        <p class="compare-card__tag">${key === "ai" ? "01 / AI" : key === "line" ? "02 / LINE" : "03 / PHONE"}</p>
        <h3 id="compare-${key}">${escapeHtml(channelCardTitle(config, key))}</h3>
      </div>
    </div>
    <p class="compare-card__audience">${escapeHtml(audience)}</p>
    <dl class="compare-card__facts">
      <div><dt>担当</dt><dd>${escapeHtml(channelProcess(config, key))}</dd></div>
      <div><dt>費用</dt><dd>${channelFee(config, key)}</dd></div>
      <div><dt>受付・返信</dt><dd>${channelHours(config, key)}</dd></div>
      <div><dt>${connectionLabel}</dt><dd>${connection ? escapeHtml(connection) : pending()}</dd></div>
      ${extraFacts}
    </dl>
    <div class="compare-card__note">
      ${
        key === "ai"
          ? `<p class="compare-card__note-label">質問例</p>
      <p>年度途中で退職を考えています。最初に何を整理すればよいですか？</p>
      <p class="compare-card__fine">質問例は、実際の相談履歴ではありません。AIの回答には誤りが含まれる場合があります。氏名・園名・園児や保護者の個人情報は入力しないでください。</p>`
          : key === "line"
            ? `<p class="compare-card__note-label">操作は分かれています</p>
      <p>LINE ID：${escapeHtml(channel.id || "確認中")}。友だち追加、メッセージ送信、正式依頼は、それぞれ別の操作です。追加しただけでは正式依頼になりません。</p>`
            : `<p class="compare-card__note-label">発信前に確認</p>
      <p>${phoneNote}</p>`
      }
    </div>
    <div class="compare-card__action">
      ${channelButton(config, key, {
        mode,
        placement: "methods",
        label: key === "phone" && channel.requestViaLine === true ? "LINEで電話相談希望を送る" : "この方法で相談する",
        variant: key === "line" ? "primary" : "outline",
        showIcon: false,
        showNote: false,
      })}
    </div>
  </article>`;
}

function lineContactPanel(config, mode) {
  const line = config.channels?.line ?? {};
  const hasQr = Boolean(line.qrAsset);
  const visual = hasQr
    ? `<div class="line-qr-panel__visual"><img class="line-qr-panel__image" src="${escapeHtml(line.qrAsset)}" alt="LINE公式アカウント ${escapeHtml(line.id || "")} の友だち追加QRコード" width="180" height="180" loading="lazy"></div>`
    : mode === "preview"
      ? `<div class="line-qr-panel__visual"><div class="line-qr-panel__placeholder" role="img" aria-label="QRコード画像の追加待ち">QR画像を追加後<br>ここに表示</div></div>`
      : "";
  const link = line.url
    ? `<a class="button button--primary" href="${escapeHtml(line.url)}" target="_blank" rel="noopener noreferrer">LINEを追加する ${icon("arrowRight")}</a>`
    : `<span class="button button--primary button--pending" aria-disabled="true">LINEアカウント確認中</span>`;

  return `<aside class="line-qr-panel${hasQr || mode === "preview" ? "" : " line-qr-panel--text-only"}" aria-labelledby="line-qr-title" id="line-qr">
    ${visual}
    <div class="line-qr-panel__content">
      <p class="line-qr-panel__eyebrow">LINE / HUMAN SUPPORT</p>
      <h3 id="line-qr-title">人に相談したいときは、LINEから。</h3>
      <p>友だち追加後、状況をメッセージでお送りください。電話相談をご希望の場合は「電話相談希望」と送信してください。</p>
      <p class="line-qr-panel__id">LINE ID <strong>${escapeHtml(line.id || "確認中")}</strong></p>
      ${link}
      <p class="line-qr-panel__fine">メッセージは送信前に内容を確認できます。友だち追加や送信だけで正式依頼にはなりません。${line.verified === true ? "" : "このプレビューではアカウントの動作を未確認です。"}</p>
    </div>
  </aside>`;
}

function scopeCard(config, mode, { iconName, tag, title, items, emptyText }) {
  const list =
    Array.isArray(items) && items.length > 0
      ? `<ul class="scope-card__list">${items.map((entry) => `<li>${icon("check")}<span>${escapeHtml(entry)}</span></li>`).join("")}</ul>`
      : `<p class="scope-card__empty">${pending(emptyText || "公開前に確定します")}</p>`;
  return `<article class="scope-card">
    <div class="scope-card__head">
      <span class="scope-card__icon">${icon(iconName)}</span>
      <span class="scope-card__tag">${escapeHtml(tag)}</span>
    </div>
    <h3>${escapeHtml(title)}</h3>
    ${list}
  </article>`;
}

function priceRow(config, mode, { id, label, valueHtml, note, extraClass = "" }) {
  return `<div class="price-row ${extraClass}">
    <dt>
      <span class="price-row__label">${escapeHtml(label)}</span>
      ${note ? `<span class="price-row__note">${note}</span>` : ""}
    </dt>
    <dd>${valueHtml}</dd>
  </div>`;
}

function faqItem({ id, question, answer, index }) {
  return `<details class="faq-item" id="faq-${String(index).padStart(2, "0")}" data-faq-id="faq-${String(index).padStart(2, "0")}">
    <summary>
      <span class="faq-item__q">${escapeHtml(question)}</span>
      <span class="faq-item__icon" aria-hidden="true"></span>
    </summary>
    <div class="faq-item__body">${answer}</div>
  </details>`;
}

function faqAnswer(config, index) {
  const undecided = config.service?.acceptsUndecided;
  const staffing = config.service?.staffing;
  const membership = config.service?.membershipConditions;
  const policy = config.service?.contactPolicy;
  const policyApproved = config.service?.contactPolicyApproved === true;
  const pricingReady = (config.pricing?.items || [])
    .filter((entry) => ["ai-fee", "line-fee", "phone-fee"].includes(entry.id))
    .every((entry) => entry.verified === true && typeof entry.amount === "number");
  const legalReady = ["privacyContact", "retentionPeriod"].every((key) => Boolean(config.legal?.[key]));

  const answers = {
    1:
      undecided === true
        ? "退職を決めていない段階でも相談できます。相談することと、正式に依頼することは別の手続きです。"
        : undecided === false
          ? "退職を決めていない段階の相談は受け付けていません。正式な依頼を検討されている場合は、まず相談窓口へご連絡ください。"
          : `退職を決めていない段階で相談できるかは、受付方針として公開前に確定します。${pendingInline("受付方針：確認中")} 相談することと、正式に依頼することは別の手続きです。`,
    2:
      "AIは自動応答で、質問や気持ちの整理を補助します。LINE・電話は元保育士のスタッフが担当します。AIの回答には誤りが含まれる場合があり、個別の対応や正式なご依頼は組合担当者が確認します。",
    3:
      staffing
        ? escapeHtml(staffing)
        : `LINE・電話の相談は、元保育士のスタッフが担当します。一次受付を別の担当者が行う場合の流れや、担当者の経歴は、公開前に確認して掲載します。${pendingInline("担当体制：確認中")}`,
    4:
      `AI・LINE・電話それぞれの料金は、<a href="#pricing">料金と組合加入</a>に表示します。0円の範囲がある場合も、回数や条件を含めて表示します。電話は相談料と通話料を分けています。${pricingReady ? "" : pendingInline("相談料：確認中")}`,
    5:
      "年度途中の退職についても相談できます。ただし、契約期間・雇用形態・園の状況によって支援の可否や進め方が変わるため、個別に確認します。",
    6:
      "担任をしている方の相談も受け付けます。引継ぎやクラス運営の事情を聞いたうえで、進め方を整理します。",
    7:
      `勤務先への連絡が一切ないと保証するものではありません。連絡が必要な場合は、事前に本人へ説明し、同意を得たうえで行う方針です。${policyApproved ? "" : pendingInline("連絡方針：承認確認中")}`,
    8:
      "希望日と、実際に退職が成立する日は別です。契約期間・園の状況・手続きによって変わるため、個別に確認する前に日付を確約しません。",
    9:
      membership
        ? escapeHtml(membership)
        : `組合加入の要否・時点・費用・手続きは、実際の規約に基づいて案内します。${pendingInline("加入条件：確認中")}`,
    10:
      "雇用主・雇用形態を確認したうえで、対応可否を案内します。公立施設や有期契約などは、個別確認が必要です。",
    11:
      `相談しただけでは、勤務先へ連絡しません。連絡が必要な場合は、内容と方法を説明し、本人の同意を得てから行います。${policyApproved ? "" : pendingInline("連絡方針：承認確認中")}`,
    12:
      `相談内容は、相談対応と必要な支援の検討に使用します。保存期間・共有先・AIの利用・削除の方法は、<a href="/privacy/">個人情報の取扱い</a>に基づいて案内します。${legalReady ? "" : pendingInline("保存・削除：確認中")}`,
  };

  if (index === 7 && policy && !policyApproved) {
    return `${answers[7]}<p class="faq-item__policy">方針案：${escapeHtml(policy)}</p>`;
  }
  if (index === 11 && policy && !policyApproved) {
    return `${answers[11]}<p class="faq-item__policy">方針案：${escapeHtml(policy)}</p>`;
  }
  return answers[index];
}

function aiChatPanel() {
  return `<section class="ai-chat-panel" id="ai-chat" aria-labelledby="ai-chat-title">
    <div class="ai-chat-panel__intro">
      <p class="ai-chat-panel__eyebrow">AI CHAT / OPENAI API</p>
      <h3 id="ai-chat-title">保育の悩みを、チャットで整理する</h3>
      <p>退職や園での働き方について、状況を整理するためのAIチャットです。AIの回答には誤りが含まれる場合があり、法律判断や正式な支援の確約はできません。</p>
    </div>
    <div class="ai-chat-panel__conversation" data-ai-chat-log role="log" aria-label="AIとの会話" aria-live="polite" aria-relevant="additions text">
      <p class="ai-chat-message ai-chat-message--assistant">こんにちは。まずは、今いちばん整理したいことを教えてください。氏名や園名など、個人が特定できる情報は書かないでください。</p>
    </div>
    <form class="ai-chat-form" data-ai-chat-form action="/api/chat" method="post">
      <label for="ai-chat-input">相談内容</label>
      <textarea id="ai-chat-input" name="message" rows="3" maxlength="1500" required placeholder="例：年度途中で退職を考えています。何から整理すればよいですか？"></textarea>
      <p class="ai-chat-form__privacy">氏名・園名・園児・保護者・同僚の個人情報は入力しないでください。送信内容は回答生成のためOpenAI APIへ送られます。</p>
      <div class="ai-chat-form__actions">
        <button class="button button--primary" type="submit" data-ai-chat-submit>AIに質問する ${icon("arrowRight")}</button>
        <span class="ai-chat-form__status" data-ai-chat-status role="status" aria-live="polite"></span>
      </div>
    </form>
    <p class="ai-chat-panel__fine">このチャットは自動応答です。相談料は無料です。人に相談したい場合は、AIを使わずLINEや電話相談を選べます。会話の取扱いは<a href="/privacy/">個人情報の取扱い</a>をご確認ください。</p>
    <noscript><p class="ai-chat-panel__noscript">AIチャットにはJavaScriptが必要です。JavaScriptを利用できない場合は、LINE相談をご利用ください。</p></noscript>
  </section>`;
}

export function renderHome({ config, mode }) {
  const operator = config.operator ?? {};
  const scope = config.service?.scope ?? {};
  const staffing = config.service?.staffing;
  const audience = config.service?.audience;
  const preview = mode !== "production";
  const totalNote = config.pricing?.total?.note
    ? escapeHtml(config.pricing.total.note)
    : "総額の条件は公開前に確定します。";
  const taxNote = config.pricing?.taxNote
    ? escapeHtml(config.pricing.taxNote)
    : "税区分は公開前に確定します。";
  const supportFee = item(config, "support-fee");
  const unionEnrollment = item(config, "union-enrollment");
  const unionMonthly = item(config, "union-monthly");
  const additional = item(config, "additional-costs");
  const aiItem = item(config, "ai-fee");
  const lineItem = item(config, "line-fee");
  const phoneItem = item(config, "phone-fee");
  const consultItems = [aiItem, lineItem, phoneItem];
  const consultReady =
    consultItems.every((entry) => entry && entry.verified === true && typeof entry.amount === "number");
  const consultSummary = consultReady
    ? consultItems.every((entry) => entry.amount === 0)
      ? "相談料無料"
      : consultItems
          .map((entry, index) => `${["AI", "LINE", "電話"][index]} ${formatAmount(entry.amount)}`)
          .join(" / ")
    : pending("窓口ごとに確認");
  const legalName = operator.legalName
    ? escapeHtml(operator.legalName)
    : pendingInline("組合正式名称：確認中");

  const faqItems = [
    ["まだ退職するか決めていなくても相談できますか？"],
    ["AIと元保育士への相談は、何が違いますか？"],
    ["LINEも電話も元保育士が対応しますか？"],
    ["相談料はかかりますか？"],
    ["年度途中でも相談できますか？"],
    ["担任をしていても相談できますか？"],
    ["園から自分に連絡が来ることはありますか？"],
    ["いつ退職できますか？"],
    ["組合への加入は必要ですか？"],
    ["公立の園や特別な雇用形態でも利用できますか？"],
    ["相談しただけで園に連絡されますか？"],
    ["相談内容はどのように扱われますか？"],
  ];

  const body = `
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__wash" aria-hidden="true"></div>
    <div class="container hero__grid">
      <div class="hero__copy">
        <p class="hero__eyebrow"><span class="hero__eyebrow-rule" aria-hidden="true"></span>労働組合運営｜${escapeHtml(config.brandName)}</p>
        <h1 id="hero-title"><span class="hero__h1-line">保育士の退職代行。</span><span class="hero__h1-line hero__h1-line--accent">保育の悩みから、<br class="hero__br">相談できる。</span></h1>
        <p class="hero__quote">「子どもは好き。でも、今の園で働き続けるのはつらい。」</p>
        <p class="hero__lead">担任のこと、年度途中のこと、園長への伝え方。<br>保育特化AIへのチャット、元保育士へのLINE・電話相談から、話しやすい方法を選べます。</p>
        <div class="hero__actions">
          <a class="button button--primary" href="#consult">3つの相談方法を見る ${icon("arrowDown")}</a>
          <a class="text-link" href="#price-summary">退職代行の料金・対応範囲を見る ${icon("arrowRight")}</a>
        </div>
        <p class="hero__note">${icon("info")} AIは、人に相談するための必須ステップではありません。LINE・電話だけでも相談できます。</p>
      </div>
      <aside class="hero-panel" aria-labelledby="hero-panel-title">
        <div class="hero-panel__head">
          <p class="hero-panel__kicker">CONTACT / 3 WAYS</p>
          <h2 id="hero-panel-title">相談方法を選ぶ</h2>
          <p>話しやすい方法から始められます。</p>
        </div>
        <div class="method-stack">
          ${heroMethodCard(config, "ai", mode)}
          ${heroMethodCard(config, "line", mode)}
          ${heroMethodCard(config, "phone", mode)}
        </div>
        <p class="hero-panel__foot">${preview ? "接続先・電話番号・費用は公開前に確認します。" : "各窓口の受付条件は、相談方法の詳細に表示しています。"}</p>
      </aside>
    </div>
    <div class="container hero__foot">
      <div class="hero__trust" aria-label="サービスの特徴">
        <span>${icon("building")} 労働組合運営</span>
        <span>${icon("users")} 元保育士へのLINE・電話相談</span>
        <span>${icon("ai")} 保育特化AIチャット</span>
      </div>
      <a class="hero__scroll" href="#consult">相談方法を読む ${icon("arrowDown")}</a>
    </div>
  </section>

  <section class="section section--consult" id="consult" aria-labelledby="consult-title">
    <div class="container">
      ${sectionHead({
        number: "01",
        eyebrow: "相談方法",
        title: "あなたに合う、3つの相談方法",
        lead: "AIは、考えを整理するための入口です。人に話したいときは、LINEでも電話でも。使いたい方法だけを選べます。",
        id: "consult-title",
      })}
      <div class="consult-callout">
        <span class="consult-callout__icon">${icon("info")}</span>
        <p><strong>AIを経由しないと、人に相談できない構造にはしていません。</strong>LINE・電話は、どちらも最上部から直接選べます。</p>
      </div>
      ${aiChatPanel()}
      <div class="compare-grid">
        ${comparisonCard(config, "ai", mode)}
        ${comparisonCard(config, "line", mode)}
        ${comparisonCard(config, "phone", mode)}
      </div>
      ${lineContactPanel(config, mode)}
      <p class="section-fine">担当者・料金・受付時間・返信時間は、公開前に確認した内容を表示します。${preview ? pendingInline("表示内容：確認中") : ""}</p>
    </div>
  </section>

  <section class="section section--worries" id="worries" aria-labelledby="worries-title">
    <div class="container">
      <div class="worries-layout">
        <div>
          ${sectionHead({
            number: "02",
            eyebrow: "相談テーマ",
            title: "こんなことも、相談できます",
            lead: "うまく説明できなくても大丈夫です。まずは、今引っかかっていることを話してください。",
            id: "worries-title",
          })}
          <p class="section-fine section-fine--left">以下は相談テーマの例です。利用者の体験談ではありません。</p>
        </div>
        <div class="worries-grid">
          <article class="worry-card">
            <span class="worry-card__num">01</span>
            <p>年度途中で辞めたいけれど、担任を外れることが気になっている。</p>
            <span class="worry-card__tag">年度途中</span>
          </article>
          <article class="worry-card">
            <span class="worry-card__num">02</span>
            <p>園長に退職を伝えることが怖い。</p>
            <span class="worry-card__tag">園長への伝え方</span>
          </article>
          <article class="worry-card">
            <span class="worry-card__num">03</span>
            <p>引継ぎや保護者への説明を、どう考えればよいかわからない。</p>
            <span class="worry-card__tag">引継ぎ</span>
          </article>
          <article class="worry-card">
            <span class="worry-card__num">04</span>
            <p>もう少し続けるか、退職するかで迷っている。</p>
            <span class="worry-card__tag">迷い</span>
          </article>
        </div>
      </div>
      <div class="worries-cta">
        <p>言葉にならない段階でも、相談することはできます。</p>
        <a class="text-link" href="#consult">3つの相談方法を見る ${icon("arrowRight")}</a>
      </div>
    </div>
  </section>

  <section class="section section--price-summary" id="price-summary" aria-labelledby="price-summary-title">
    <div class="container">
      <div class="price-summary__grid">
        <div class="price-summary__copy">
          <p class="eyebrow eyebrow--light"><span class="eyebrow__num">03</span><span class="eyebrow__label">費用と対応範囲</span></p>
          <h2 id="price-summary-title">費用と対応範囲を、<br>先に確認。</h2>
          <p class="price-summary__lead">相談にかかる費用と、退職支援にかかる費用を分けて表示します。利用者が実際に負担する総額が読める形で案内します。</p>
          <a class="button button--light-outline" href="#pricing">料金と組合加入について ${icon("arrowDown")}</a>
        </div>
        <div class="price-summary__tiles">
          <article class="price-tile">
            <span class="price-tile__label">相談料</span>
            <span class="price-tile__value">${consultSummary}</span>
            <span class="price-tile__note">AI・LINE・電話の相談料は無料です。</span>
          </article>
          <article class="price-tile">
            <span class="price-tile__label">退職代行の支援料</span>
            <span class="price-tile__value">${priceValue(supportFee, mode)}</span>
            <span class="price-tile__note">退職支援の総額は下のTOTAL欄に表示します。</span>
          </article>
          <article class="price-tile">
            <span class="price-tile__label">組合費</span>
            <span class="price-tile__value">${unionEnrollment && unionEnrollment.verified ? `加入金 ${priceValue(unionEnrollment, mode)}` : pending("加入金：確認中")}</span>
            <span class="price-tile__note">${unionMonthly && unionMonthly.verified ? `会費 ${priceValue(unionMonthly, mode)}（初回分）` : "加入金・会費の条件を確認します。"}</span>
          </article>
          <article class="price-tile">
            <span class="price-tile__label">追加費用</span>
            <span class="price-tile__value">${priceValue(additional, mode)}</span>
            <span class="price-tile__note">発生条件と計算方法を事前に表示します。</span>
          </article>
        </div>
      </div>
      <div class="price-summary__total">
        <div>
          <p class="price-summary__total-kicker">TOTAL / 退職支援の総額</p>
          <p class="price-summary__total-note">${totalNote}</p>
        </div>
        <div class="price-summary__total-value">${totalValue(config, mode)}</div>
      </div>
      <p class="price-summary__fine">${preview ? "プレビューでは未確認の金額を0円として表示していません。公開用ビルドでは、未確認の料金があると公開できません。" : "表示金額は公開時点の条件に基づきます。税区分・支払い時点・取消条件は料金の詳細をご確認ください。"}</p>
    </div>
  </section>

  <section class="section section--staff" id="staff" aria-labelledby="staff-title">
    <div class="container staff-layout">
      <div class="staff-copy">
        ${sectionHead({
          number: "04",
          eyebrow: "相談する人",
          title: "保育の現場を経験したスタッフが、<br>お話を伺います",
          lead: staffing
            ? `${escapeHtml(staffing).replace(/。$/, "")}。園での働き方や、担任・引継ぎの事情を踏まえて、話を整理します。`
            : "LINE・電話では、元保育士のスタッフが相談を担当します。園での働き方や、担任・引継ぎの事情を踏まえて、話を整理します。",
          id: "staff-title",
        })}
        <ul class="staff-topics">
          <li>${icon("check")} 担任・年度途中のこと</li>
          <li>${icon("check")} 園長への伝え方</li>
          <li>${icon("check")} 引継ぎの整理</li>
          <li>${icon("check")} 迷っている気持ち</li>
        </ul>
        <p class="staff-note">相談員の氏名・勤務経験・担当する相談窓口・プロフィール更新日は、本人の確認と掲載許可を得た情報だけを掲載します。一次受付を別の担当者が行う場合は、実際の流れを表示します。</p>
        <a class="text-link" href="#consult">LINE・電話の相談方法を見る ${icon("arrowRight")}</a>
      </div>
      <div class="staff-cards">
        ${staffCards(config, mode)}
      </div>
    </div>
  </section>

  <section class="section section--union" id="union" aria-labelledby="union-title">
    <div class="container">
      <div class="union-layout">
        <div class="union-copy">
          ${sectionHead({
            number: "05",
            eyebrow: "運営",
            title: "退職支援は、運営する労働組合が担当します",
            lead: `保育士リトリートは、${legalName}が運営する退職相談・退職代行サービスです。ご相談内容を確認し、対応できる範囲・費用・必要な手続きをご案内します。`,
            id: "union-title",
          })}
          <p class="union-note">労働組合には団体交渉権がありますが、組合であることだけですべての相談・対象者・手続きを無制限に扱えるわけではありません。個別の対応範囲は、確認のうえご案内します。</p>
          <a class="text-link" href="/about/">運営体制と組合について ${icon("arrowRight")}</a>
        </div>
        <div class="union-panel">
          <p class="union-panel__kicker">OPERATING STRUCTURE</p>
          <div class="union-diagram">
            <div class="union-node union-node--primary">
              <span class="union-node__label">運営</span>
              <strong>労働組合</strong>
              <small>${operator.legalName ? escapeHtml(operator.legalName) : pendingInline("正式名称：確認中")}</small>
            </div>
            <span class="union-arrow" aria-hidden="true">${icon("arrowDown")}</span>
            <div class="union-node">
              <span class="union-node__label">サービス</span>
              <strong>${escapeHtml(config.brandName)}</strong>
              <small>退職相談・退職代行</small>
            </div>
            <span class="union-arrow" aria-hidden="true">${icon("arrowDown")}</span>
            <div class="union-node">
              <span class="union-node__label">相談窓口</span>
              <strong>AI・LINE・電話</strong>
              <small>話しやすい方法を選べます</small>
            </div>
          </div>
          <dl class="union-facts">
            <div><dt>所在地</dt><dd>${operator.address ? escapeHtml(operator.address) : pending()}</dd></div>
            <div><dt>責任者</dt><dd>${operator.responsiblePerson ? escapeHtml(operator.responsiblePerson) : pending()}</dd></div>
            <div><dt>加入・脱退</dt><dd>${config.service?.membershipConditions ? escapeHtml(config.service.membershipConditions) : pending()}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--scope" id="scope" aria-labelledby="scope-title">
    <div class="container">
      ${sectionHead({
        number: "06",
        eyebrow: "対応範囲",
        title: "ご相談から、退職に向けた支援まで",
        lead: `${audience ? `${escapeHtml(audience)}を対象に、` : ""}できることと、確認が必要なことを分けて案内します。すべてを一律に約束するものではありません。`,
        id: "scope-title",
      })}
      ${preview ? `<p class="scope-preview-note">${icon("info")} 対応範囲は公開前に確定します。以下は表示項目の案です。</p>` : ""}
      <div class="scope-grid">
        ${scopeCard(config, mode, {
          iconName: "chat",
          tag: "相談",
          title: "相談できること",
          items: scope.consultation,
        })}
        ${scopeCard(config, mode, {
          iconName: "users",
          tag: "組合支援",
          title: "組合が担当する支援",
          items: scope.unionSupport,
        })}
        ${scopeCard(config, mode, {
          iconName: "document",
          tag: "要確認",
          title: "個別確認が必要なこと",
          items: scope.individualReview,
        })}
        ${scopeCard(config, mode, {
          iconName: "info",
          tag: "対象外",
          title: "現在の体制で扱わないこと",
          items: scope.outOfScope,
          emptyText: "対象外の業務は公開前に確定します",
        })}
      </div>
      <div class="scope-foot">
        <p>記載の内容は対応の確約ではありません。個別のご事情を確認したうえでご案内します。</p>
        <a class="text-link" href="#consult">自分の場合の対応を相談する ${icon("arrowRight")}</a>
      </div>
    </div>
  </section>

  <section class="section section--flow" id="flow" aria-labelledby="flow-title">
    <div class="container flow-layout">
      <div class="flow-intro">
        ${sectionHead({
          number: "07",
          eyebrow: "ご利用の流れ",
          title: "ご利用の流れ",
          lead: "相談から正式依頼、必要な組合加入、退職に向けた連絡・調整までの順序を、先に確認できます。",
          id: "flow-title",
        })}
        <div class="flow-caution">
          <span class="flow-caution__icon">${icon("info")}</span>
          <p>相談ボタンの押下、AIへの質問、LINE追加、電話の発信は、正式依頼や組合加入への同意ではありません。</p>
        </div>
      </div>
      <ol class="flow-list">
        <li class="flow-step">
          <span class="flow-step__num">01</span>
          <div><h3>相談する</h3><p>AIチャット、LINE、電話から選べます。AIだけ、LINE・電話だけでも相談できます。</p></div>
        </li>
        <li class="flow-step">
          <span class="flow-step__num">02</span>
          <div><h3>状況と希望を確認</h3><p>対象・費用・対応範囲を説明します。退職の時期や園の状況も、ここで確認します。</p></div>
        </li>
        <li class="flow-step">
          <span class="flow-step__num">03</span>
          <div><h3>正式依頼と必要な組合加入</h3><p>相談と正式依頼は別です。必要な加入の時点・費用・手続きを、規約に沿って案内します。</p></div>
        </li>
        <li class="flow-step">
          <span class="flow-step__num">04</span>
          <div><h3>連絡内容・希望の確認</h3><p>誰に、いつ、どのように伝えるかを確認します。本人の希望を起点に進めます。</p></div>
        </li>
        <li class="flow-step">
          <span class="flow-step__num">05</span>
          <div><h3>組合による連絡・調整</h3><p>本人への説明と同意なく勤務先へ連絡しません。連絡内容は事前に確認します。</p></div>
        </li>
        <li class="flow-step">
          <span class="flow-step__num">06</span>
          <div><h3>後続手続きの案内</h3><p>必要な書類や日程など、退職後に必要な手続きを案内します。</p></div>
        </li>
      </ol>
      <div class="flow-cta">
        <a class="button button--primary" href="#consult">相談方法を選ぶ ${icon("arrowRight")}</a>
        <p>${preview ? "受付時間・費用・加入条件は公開前に確定します。" : "受付時間・費用・加入条件は各窓口の表示をご確認ください。"}</p>
      </div>
    </div>
  </section>

  <section class="section section--pricing" id="pricing" aria-labelledby="pricing-title">
    <div class="container pricing-layout">
      <div class="pricing-intro">
        ${sectionHead({
          number: "08",
          eyebrow: "料金",
          title: "料金と組合加入について",
          lead: "相談料、退職代行の支援料、組合費を分けて表示します。追加費用が発生する条件も、事前に確認できるようにします。",
          id: "pricing-title",
        })}
        <div class="pricing-total">
          <p class="pricing-total__kicker">TOTAL / 退職支援の総額</p>
          <p class="pricing-total__value">${totalValue(config, mode)}</p>
          <p class="pricing-total__note">${totalNote}</p>
          <p class="pricing-total__tax">${taxNote}</p>
        </div>
        <p class="section-fine">料金の短い表示・詳細・FAQは、同じ設定データから生成しています。${preview ? "未確認の料金を0円として扱いません。" : ""}</p>
      </div>
      <div class="pricing-body">
        <section class="price-group" aria-labelledby="price-consult">
          <h3 class="price-group__title" id="price-consult">相談</h3>
          <dl class="price-list">
            ${priceRow(config, mode, {
              id: "ai-fee",
              label: "保育特化AIチャット",
              valueHtml: priceValue(aiItem, mode),
              note: aiItem?.note ? escapeHtml(aiItem.note) : null,
            })}
            ${priceRow(config, mode, {
              id: "line-fee",
              label: "LINE相談",
              valueHtml: priceValue(lineItem, mode),
              note: lineItem?.note ? escapeHtml(lineItem.note) : null,
            })}
            ${priceRow(config, mode, {
              id: "phone-fee",
              label: "電話相談（相談料）",
              valueHtml: priceValue(phoneItem, mode),
              note: phoneItem?.note ? escapeHtml(phoneItem.note) : null,
            })}
            <div class="price-row price-row--note">
              <dt><span class="price-row__label">通話料</span><span class="price-row__note">通信会社へ別途</span></dt>
              <dd>${config.channels?.phone?.callChargeDisclosure ? escapeHtml(config.channels.phone.callChargeDisclosure) : pending()}</dd>
            </div>
          </dl>
        </section>
        <section class="price-group" aria-labelledby="price-support">
          <h3 class="price-group__title" id="price-support">退職支援</h3>
          <dl class="price-list">
            ${priceRow(config, mode, {
              id: "support-fee",
              label: "退職代行の支援料",
              valueHtml: priceValue(supportFee, mode),
              note: supportFee?.note ? escapeHtml(supportFee.note) : null,
            })}
            ${priceRow(config, mode, {
              id: "union-enrollment",
              label: "組合加入金",
              valueHtml: priceValue(unionEnrollment, mode),
              note: unionEnrollment?.note ? escapeHtml(unionEnrollment.note) : null,
            })}
            ${priceRow(config, mode, {
              id: "union-monthly",
              label: "組合費（初回分）",
              valueHtml: priceValue(unionMonthly, mode),
              note: unionMonthly?.note ? escapeHtml(unionMonthly.note) : null,
            })}
            ${priceRow(config, mode, {
              id: "additional-costs",
              label: "追加費用",
              valueHtml: priceValue(additional, mode),
              note: additional?.note ? escapeHtml(additional.note) : null,
            })}
          </dl>
        </section>
        <section class="price-group" aria-labelledby="price-terms">
          <h3 class="price-group__title" id="price-terms">支払い・条件</h3>
          <dl class="price-list">
            ${priceRow(config, mode, {
              id: "payment-methods",
              label: "支払い方法",
              valueHtml: config.pricing?.paymentMethods ? escapeHtml(config.pricing.paymentMethods) : pending(),
            })}
            ${priceRow(config, mode, {
              id: "payment-timing",
              label: "支払い時点",
              valueHtml: config.pricing?.paymentTiming ? escapeHtml(config.pricing.paymentTiming) : pending(),
            })}
            ${priceRow(config, mode, {
              id: "cancellation",
              label: "取消・返金",
              valueHtml: config.service?.cancellationRefundPolicy ? escapeHtml(config.service.cancellationRefundPolicy) : pending(),
            })}
            ${priceRow(config, mode, {
              id: "membership",
              label: "組合加入の条件",
              valueHtml: config.service?.membershipConditions ? escapeHtml(config.service.membershipConditions) : pending(),
            })}
            ${priceRow(config, mode, {
              id: "relation",
              label: "相談料と支援料の関係",
              valueHtml: config.service?.consultationRelationNote ? escapeHtml(config.service.consultationRelationNote) : pending(),
            })}
          </dl>
        </section>
        <p class="pricing-fine">${taxNote}。${preview ? "公開用ビルドでは、未確認の料金・条件があると公開できません。" : "詳細な取引条件は、取引条件・事業者情報をご確認ください。"} <a href="/disclosures/">取引条件・事業者情報</a></p>
      </div>
    </div>
  </section>

  <section class="section section--faq" id="faq" aria-labelledby="faq-title">
    <div class="container faq-layout">
      <div class="faq-intro">
        ${sectionHead({
          number: "09",
          eyebrow: "よくあるご質問",
          title: "よくあるご質問",
          lead: "相談前に確認したい、費用・担当・連絡・日程についてまとめました。",
          id: "faq-title",
        })}
        ${preview ? `<p class="faq-preview-note">${icon("info")} このプレビューでは、運営の承認が必要な回答に「確認中」を表示しています。</p>` : ""}
        <a class="text-link" href="#consult">それでも迷うときは、相談方法を見る ${icon("arrowRight")}</a>
      </div>
      <div class="faq-list">
        ${faqItems
          .map(([question], index) =>
            faqItem({
              id: index + 1,
              question,
              answer: faqAnswer(config, index + 1),
              index: index + 1,
            }),
          )
          .join("")}
      </div>
    </div>
  </section>

  <section class="section section--closing" id="closing" aria-labelledby="closing-title">
    <div class="container">
      <div class="closing-head">
        <p class="eyebrow eyebrow--light"><span class="eyebrow__num">10</span><span class="eyebrow__label">相談開始</span></p>
        <h2 id="closing-title">話しやすい方法から、<br>始めてください。</h2>
        <p>AIでも、LINEでも、電話でも。相談することと、正式に依頼することは別です。</p>
      </div>
      <div class="closing-actions">
        <div class="closing-action">
          ${channelButton(config, "ai", { mode, placement: "closing", label: channelLabel(config, "ai"), variant: "on-dark", showNote: true })}
          <p>まずは質問や気持ちを整理したい方へ</p>
        </div>
        <div class="closing-action closing-action--primary">
          ${channelButton(config, "line", { mode, placement: "closing", label: channelLabel(config, "line"), variant: "light-primary", showNote: true })}
          <p>文字で自分の状況を伝えたい方へ</p>
        </div>
        <div class="closing-action">
          ${channelButton(config, "phone", { mode, placement: "closing", label: channelLabel(config, "phone"), variant: "on-dark", showNote: true })}
          <p>声で話しながら相談したい方へ</p>
        </div>
      </div>
      <div class="closing-foot">
        <p>受付時間・費用・担当体制は、公開前に確認した内容を表示します。${preview ? pendingInline("表示内容：確認中") : ""}</p>
        <p>運営：${operator.legalName ? escapeHtml(operator.legalName) : "労働組合（正式名称は公開前に確定）"}</p>
      </div>
    </div>
  </section>`;

  return {
    name: "home",
    path: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    body,
    stickyCta: true,
    breadcrumbs: [{ label: "ホーム", path: "/" }],
  };
}
