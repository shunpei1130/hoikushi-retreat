import { escapeHtml, pending, pendingInline } from "../../scripts/lib/html.mjs";
import { icon } from "../../scripts/lib/icons.mjs";
import { operatorFacts, staffCards } from "../../scripts/lib/components.mjs";
import { bulletList, callout, h2, pageHero, pageLayout, policyTable } from "./shared.mjs";

export function renderAbout({ config, mode }) {
  const operator = config.operator ?? {};
  const service = config.service ?? {};
  const preview = mode !== "production";
  const legalName = operator.legalName
    ? escapeHtml(operator.legalName)
    : pendingInline("組合正式名称：確認中");

  const body = `${pageHero({
    eyebrow: "運営情報 / ABOUT",
    title: "運営する労働組合と、<br>相談体制について。",
    lead: `保育士リトリートは、${legalName}が運営する退職相談・退職代行サービスです。運営主体、相談体制、対応範囲、開示情報をまとめています。`,
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "運営情報", path: "/about/" },
    ],
    meta: `最終更新：${config.contentUpdatedAt ? escapeHtml(config.contentUpdatedAt) : "公開前に確定"}`,
  })}
  ${pageLayout({
    preview,
    updatedAt: config.contentUpdatedAt,
    toc: [
      { id: "organization", label: "運営組織" },
      { id: "relationship", label: "サービスとの関係" },
      { id: "staffing", label: "相談体制" },
      { id: "scope", label: "対応範囲" },
      { id: "contact", label: "開示情報・問い合わせ" },
    ],
    body: `
      ${h2("organization", "運営組織")}
      <p>保育士リトリートは、労働組合が運営する退職相談・退職代行サービスです。運営する組合の正式名称、所在地、責任者、問い合わせ先は次のとおりです。</p>
      ${operatorFacts(config, mode)}
      <p class="prose-note">労働組合には団体交渉権がありますが、組合であることだけですべての相談・対象者・手続きを無制限に扱えるわけではありません。個別の対応範囲は、確認のうえご案内します。</p>

      ${h2("relationship", "サービスとの関係")}
      <p>労働組合がサービスの運営主体となり、相談の受付から、退職に向けた支援、必要な手続きの案内までを担当します。AIチャットはこのサイト内の相談欄からいつでも利用でき、LINE・電話相談は元保育士スタッフと女性カウンセラーが担当します。</p>
      <div class="org-diagram">
        <div class="org-diagram__node org-diagram__node--primary">
          <span>運営</span>
          <strong>労働組合</strong>
          <small>${operator.legalName ? escapeHtml(operator.legalName) : "正式名称は公開前に確定"}</small>
        </div>
        <span class="org-diagram__line" aria-hidden="true"></span>
        <div class="org-diagram__node">
          <span>サービス</span>
          <strong>${escapeHtml(config.brandName)}</strong>
          <small>退職相談・退職代行</small>
        </div>
        <span class="org-diagram__line" aria-hidden="true"></span>
        <div class="org-diagram__node">
          <span>窓口</span>
          <strong>AI・LINE・電話</strong>
          <small>話しやすい方法を選べます</small>
        </div>
      </div>
      <p>別の組織が受付・システム・決済等を担当する場合は、誰がどの業務を担うかを明確にし、このページと各サービスの表示を一致させます。</p>

      ${h2("staffing", "相談体制")}
      <p>${service.staffing ? `${escapeHtml(service.staffing).replace(/。$/, "")}。` : "LINE・電話の相談は、元保育士のスタッフが担当します。"}園での働き方や、担任・引継ぎの事情を踏まえて、話を整理します。相談員の氏名・勤務経験・担当する相談窓口・プロフィール更新日は、本人の確認と掲載許可を得た情報だけを掲載します。</p>
      <div class="staff-cards staff-cards--about">
        ${staffCards(config, mode)}
      </div>
      <p>一次受付を別の担当者が行う場合や、相談員と園への連絡を担当する組合担当者が別の場合は、実際の流れと役割を分けて表示します。「全員が元保育士」と確認なく表現することはありません。</p>

      ${h2("scope", "対応範囲")}
      <p>対応範囲は、<a href="/#reasons">選ばれる理由</a>および<a href="/#flow">ご利用の流れ</a>でご案内しています。有期契約、特別な雇用形態、公立施設勤務などは、雇用主・雇用形態を確認したうえで対応可否を案内します。</p>
      ${bulletList([
        "相談することと、正式に依頼することは別の手続きです。",
        "正式依頼の前に、対象・費用・対応範囲・必要な加入を説明します。",
        "本人への説明と同意なく勤務先へ連絡しません。",
        "対応の確約ではない事項は、個別確認が必要なものとして表示します。",
      ])}
      ${callout(
        "労働組合であることだけですべての相談・手続きを無制限に扱えるわけではありません。実際の業務・規約と一致した範囲だけを表示します。",
        { tone: "soft", title: "組合の役割と、個別の対応範囲" },
      )}

      ${h2("contact", "開示情報・問い合わせ")}
      ${policyTable([
        ["正式名称", operator.legalName ? escapeHtml(operator.legalName) : null],
        ["所在地", operator.address ? escapeHtml(operator.address) : null],
        ["責任者", operator.responsiblePerson ? escapeHtml(operator.responsiblePerson) : null],
        ["問い合わせ先", operator.contact ? escapeHtml(operator.contact) : null],
        ["受付時間", operator.hours ? escapeHtml(operator.hours) : null],
        ["適格請求書発行事業者登録番号", operator.invoiceRegistrationNumber ? escapeHtml(operator.invoiceRegistrationNumber) : "該当する場合に掲載します"],
      ])}
      <div class="prose-links">
        <a href="/terms/">利用条件 ${icon("arrowRight")}</a>
        <a href="/privacy/">個人情報の取扱い ${icon("arrowRight")}</a>
        <a href="/disclosures/">取引条件・事業者情報 ${icon("arrowRight")}</a>
      </div>
      <p class="prose-note">${preview ? "このページは公開前のレビュー用です。正式名称・連絡先・担当体制は、公開用ビルドまでに確定します。" : "掲載内容は、公開時点の運営体制に基づきます。"}</p>
    `,
  })}`;

  return {
    name: "about",
    path: "/about/",
    title: "運営労働組合・元保育士の相談体制｜保育士の退職代行・お悩み相談｜保育士リトリート",
    description:
      "「保育士を辞めたい」と悩む方を支援する保育士リトリートの運営労働組合情報。元保育士スタッフと女性カウンセラーによるLINE・電話無料相談体制、団体交渉権を持つ労働組合による退職代行の対応範囲・開示情報を掲載しています。",
    body,
    stickyCta: false,
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "運営情報", path: "/about/" },
    ],
  };
}
