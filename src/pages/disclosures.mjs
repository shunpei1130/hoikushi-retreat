import { escapeHtml, pending, pendingInline } from "../../scripts/lib/html.mjs";
import { priceValue, totalValue } from "../../scripts/lib/components.mjs";
import { icon } from "../../scripts/lib/icons.mjs";
import { h2, pageHero, pageLayout, policyTable } from "./shared.mjs";

export function renderDisclosures({ config, mode }) {
  const operator = config.operator ?? {};
  const service = config.service ?? {};
  const pricing = config.pricing ?? {};
  const preview = mode !== "production";
  const operatorName = operator.legalName ? escapeHtml(operator.legalName) : pendingInline("組合正式名称：確認中");
  const item = (id) => (pricing.items || []).find((entry) => entry.id === id);
  const consultationFeesFree = ["ai-fee", "line-fee", "phone-fee"].every((id) => {
    const entry = item(id);
    return entry?.verified === true && entry.amount === 0;
  });
  const allInclusiveSupportTotal =
    pricing.total?.verified === true &&
    pricing.total?.includesAllSupportCosts === true &&
    typeof pricing.total?.fixedAmount === "number";
  const plans = Array.isArray(pricing.plans) ? pricing.plans : [];

  const body = `${pageHero({
    eyebrow: "取引条件 / DISCLOSURES",
    title: "取引条件と、<br>事業者情報。",
    lead: "サービスの内容、料金、支払い方法、提供時期、取消・返金、組合加入、問い合わせ先をまとめています。正式な契約条件は、正式依頼の前に確認できるようにします。",
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "取引条件・事業者情報", path: "/disclosures/" },
    ],
    meta: `最終更新：${config.contentUpdatedAt ? escapeHtml(config.contentUpdatedAt) : "公開前に確定"}`,
  })}
  ${pageLayout({
    preview,
    updatedAt: config.contentUpdatedAt,
    toc: [
      { id: "operator", label: "事業者情報" },
      { id: "service", label: "サービス内容" },
      { id: "price", label: "料金" },
      { id: "payment", label: "支払い方法・時期" },
      { id: "delivery", label: "提供時期" },
      { id: "cancellation", label: "取消・返金" },
      { id: "membership", label: "組合加入" },
      { id: "contact", label: "お問い合わせ" },
    ],
    body: `
      ${h2("operator", "事業者情報")}
      <p>本サービスは、${operatorName}が運営しています。取引方法に応じて必要な事業者情報を、次のとおり表示します。</p>
      ${policyTable([
        ["運営主体", operator.legalName ? escapeHtml(operator.legalName) : null],
        ["所在地", operator.address ? escapeHtml(operator.address) : null],
        ["責任者", operator.responsiblePerson ? escapeHtml(operator.responsiblePerson) : null],
        ["問い合わせ先", operator.contact ? escapeHtml(operator.contact) : null],
        ["受付時間", operator.hours ? escapeHtml(operator.hours) : null],
        ["適格請求書発行事業者登録番号", operator.invoiceRegistrationNumber ? escapeHtml(operator.invoiceRegistrationNumber) : "該当する場合に掲載します"],
      ])}
      <p class="prose-note">運営する労働組合の正式名称・所在地・責任者・連絡先は、<a href="/about/">運営情報</a>にも掲載しています。</p>

      ${h2("service", "サービス内容")}
      <p>本サービスは、${service.audience ? escapeHtml(service.audience) : "保育士"}を対象とした退職相談・退職代行サービスです。AIチャット、元保育士へのLINE相談、元保育士への電話相談から、話しやすい方法を選べます。相談の後に、対象・費用・対応範囲・必要な組合加入の説明を受け、正式依頼へ進むかを判断できます。</p>
      ${service.staffing ? `<p>${escapeHtml(service.staffing).replace(/。$/, "")}。AIは自動応答で、人による回答ではありません。</p>` : ""}
      <p>相談したこと、AIへ質問したこと、LINEを追加したこと、電話を発信したことは、正式依頼や組合加入への同意ではありません。</p>

      ${h2("price", "料金")}
      <p>料金は、<a href="/#pricing">料金と組合加入</a>に表示しています。実際に負担する総額、税区分、追加費用の有無は、正式依頼の前に確認できるようにします。</p>
      <dl class="disclosure-price">
        <div><dt>保育特化AIチャット</dt><dd>${priceValue(item("ai-fee"), mode)}</dd></div>
        <div><dt>LINE相談</dt><dd>${priceValue(item("line-fee"), mode)}</dd></div>
        <div><dt>電話相談（相談料）</dt><dd>${priceValue(item("phone-fee"), mode)}</dd></div>
        <div><dt>通話料</dt><dd>${config.channels?.phone?.callChargeDisclosure ? escapeHtml(config.channels.phone.callChargeDisclosure) : pending()}</dd></div>
        ${allInclusiveSupportTotal
          ? `<div><dt>退職支援料・組合費等</dt><dd>総額に含む</dd></div>
        <div><dt>追加サービス料金</dt><dd>なし</dd></div>`
          : `<div><dt>退職代行の支援料</dt><dd>${priceValue(item("support-fee"), mode)}</dd></div>
        <div><dt>組合加入金</dt><dd>${priceValue(item("union-enrollment"), mode)}</dd></div>
        <div><dt>組合費（初回分）</dt><dd>${priceValue(item("union-monthly"), mode)}</dd></div>
        <div><dt>追加費用</dt><dd>${priceValue(item("additional-costs"), mode)}</dd></div>`}
      </dl>
      ${plans.length > 0
        ? `<div class="disclosure-plans">
        <p class="disclosure-plans__title">退職支援プラン</p>
        <dl class="disclosure-price">
          ${plans
            .map(
              (plan) =>
                `<div><dt>${escapeHtml(plan.label)}</dt><dd>${priceValue(plan, mode)}<span class="disclosure-plans__condition">${escapeHtml(plan.condition || "")}</span></dd></div>`,
            )
            .join("")}
        </dl>
      </div>`
        : ""}
      <div class="disclosure-total">
        <p>退職支援の総額（20代・就業6年以内の場合）</p>
        <p>${totalValue(config, mode)}</p>
        <p>${pricing.total?.note ? escapeHtml(pricing.total.note) : pending("総額の条件は公開前に確定します")}</p>
      </div>

      ${h2("payment", "支払い方法・時期")}
      ${policyTable([
        ["支払い方法", pricing.paymentMethods ? escapeHtml(pricing.paymentMethods) : null],
        ["支払い時点", pricing.paymentTiming ? escapeHtml(pricing.paymentTiming) : null],
        ["税区分", pricing.taxNote ? escapeHtml(pricing.taxNote) : null],
      ])}
       <p>${consultationFeesFree ? "AI・LINE・電話の相談料は無料です。" : "相談料は各窓口の表示をご確認ください。"} 相談料は退職支援の総額とは別です。電話相談で通話料等の通信費が利用者負担となるかは、実際の進め方に合わせて確認します。</p>

      ${h2("delivery", "提供時期")}
      <p>相談は、各窓口の受付時間内に受け付けます。正式依頼の成立後、対象・希望・園の状況を確認し、支援の開始時期と進め方を個別に案内します。退職の成立日や特定の日程を、事前に確約するものではありません。</p>
      <p>${preview ? pendingInline("受付時間・開始時期：確認中") : "受付時間・開始時期は、各窓口と正式依頼の案内に表示します。"}</p>

      ${h2("cancellation", "取消・返金")}
      <p>${service.cancellationRefundPolicy ? escapeHtml(service.cancellationRefundPolicy) : pendingInline("取消・返金の条件：確認中")}</p>
      <p>相談のキャンセルと、正式依頼の取消・返金は別の扱いです。正式依頼後の取消・返金は、契約内容と支援の進捗に応じて案内します。返金の有無・金額・手続き・時期は、正式な規約に基づきます。</p>

      ${h2("membership", "組合加入")}
      <p>${service.membershipConditions ? escapeHtml(service.membershipConditions) : pendingInline("組合加入の条件：確認中")}</p>
      <p>加入の要否、加入する時点、加入金・会費、脱退の条件は、組合の規約に基づいて案内します。組合加入は、正式依頼とは別の手続きです。</p>

      ${h2("contact", "お問い合わせ")}
      ${policyTable([
        ["問い合わせ先", operator.contact ? escapeHtml(operator.contact) : null],
        ["受付時間", operator.hours ? escapeHtml(operator.hours) : null],
        ["所在地", operator.address ? escapeHtml(operator.address) : null],
        ["責任者", operator.responsiblePerson ? escapeHtml(operator.responsiblePerson) : null],
      ])}
      <div class="prose-links">
        <a href="/terms/">利用条件 ${icon("arrowRight")}</a>
        <a href="/privacy/">個人情報の取扱い ${icon("arrowRight")}</a>
        <a href="/about/">運営情報 ${icon("arrowRight")}</a>
      </div>
      <p class="prose-note">${preview ? "このページは公開前のレビュー用です。取引方法に応じて必要な表示項目を確認し、公開用ビルドまでに正式な情報を確定します。" : "本ページは、公開時点の取引条件と事業者情報に基づきます。"}</p>
    `,
  })}`;

  return {
    name: "disclosures",
    path: "/disclosures/",
    title: "取引条件・事業者情報｜保育士リトリート",
    description:
      "保育士リトリートの取引条件と事業者情報。サービス内容、料金、支払い方法・時期、提供時期、取消・返金、組合加入、問い合わせ先をまとめています。",
    body,
    stickyCta: false,
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "取引条件・事業者情報", path: "/disclosures/" },
    ],
  };
}
