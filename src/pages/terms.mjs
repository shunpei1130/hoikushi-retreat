import { escapeHtml, pendingInline } from "../../scripts/lib/html.mjs";
import { bulletList, callout, h2, pageHero, pageLayout, policyTable } from "./shared.mjs";

export function renderTerms({ config, mode }) {
  const operator = config.operator ?? {};
  const service = config.service ?? {};
  const pricing = config.pricing ?? {};
  const preview = mode !== "production";
  const operatorName = operator.legalName ? escapeHtml(operator.legalName) : pendingInline("組合正式名称：確認中");
  const consultationFeesFree = ["ai-fee", "line-fee", "phone-fee"].every((id) => {
    const item = (pricing.items || []).find((entry) => entry.id === id);
    return item?.verified === true && item.amount === 0;
  });

  const body = `${pageHero({
    eyebrow: "利用条件 / TERMS",
    title: "サービスの<br>利用条件。",
    lead: "相談、正式依頼、組合加入、料金・支払い、取消・返金、勤務先への連絡など、保育士リトリートを利用する際の条件をまとめています。",
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "利用条件", path: "/terms/" },
    ],
    meta: `施行日：${config.legal?.termsEffectiveDate ? escapeHtml(config.legal.termsEffectiveDate) : "公開前に確定"}`,
  })}
  ${pageLayout({
    preview,
    updatedAt: config.contentUpdatedAt,
    toc: [
      { id: "apply", label: "適用" },
      { id: "definitions", label: "定義" },
      { id: "consult-request", label: "相談と正式依頼" },
      { id: "membership", label: "組合加入" },
      { id: "fees", label: "料金・支払い" },
      { id: "cancellation", label: "取消・返金" },
      { id: "contact-policy", label: "勤務先への連絡" },
      { id: "prohibited", label: "禁止事項" },
      { id: "changes", label: "変更・停止・免責" },
      { id: "law", label: "準拠法・お問い合わせ" },
    ],
    body: `
      ${h2("apply", "適用")}
      <p>本利用条件は、${operatorName}が運営する保育士リトリート（以下「本サービス」）の利用条件を定めるものです。相談者・利用者は、本サービスを利用する前に、本利用条件と関連する<a href="/privacy/">個人情報の取扱い</a>、<a href="/disclosures/">取引条件・事業者情報</a>をご確認ください。</p>
      <p>本サービスは、労働組合が運営する退職相談・退職代行サービスです。個別の契約条件、組合の規約、正式依頼に関する書面がある場合は、それらの内容が本利用条件に優先します。</p>
      ${policyTable([
        ["施行日", config.legal?.termsEffectiveDate ? escapeHtml(config.legal.termsEffectiveDate) : null],
        ["運営主体", operator.legalName ? escapeHtml(operator.legalName) : null],
        ["問い合わせ先", operator.contact ? escapeHtml(operator.contact) : null],
        ["組合加入の条件", service.membershipConditions ? escapeHtml(service.membershipConditions) : null],
        ["取消・返金", service.cancellationRefundPolicy ? escapeHtml(service.cancellationRefundPolicy) : null],
      ])}

      ${h2("definitions", "定義")}
      ${bulletList([
        "「本サービス」とは、保育士リトリートが提供する退職相談・退職代行および関連する案内をいいます。",
        "「相談」とは、AIチャット・LINE・電話等により、状況や希望を伝え、情報提供や進め方の整理を受けることをいいます。",
        "「正式依頼」とは、対象・費用・対応範囲・必要な組合加入の説明を受け、所定の手続きを完了して退職支援を依頼することをいいます。",
        "「組合加入」とは、運営する労働組合の規約に基づき、加入の手続きを完了することをいいます。",
      ])}

      ${h2("consult-request", "相談と正式依頼")}
      <p>相談は、正式依頼とは別の手続きです。AIへの質問、LINEの友だち追加・メッセージ送信、電話の発信、相談ボタンの押下は、正式依頼や組合加入への同意として扱いません。</p>
      ${config.channels?.phone?.requestViaLine === true ? `<p>電話相談をご希望の場合は、LINEを追加後、「電話相談希望」とメッセージを送信してください。返信で電話相談の進め方をご案内します。メッセージの送信だけで電話相談の日時が確定するものではありません。</p>` : ""}
      <p>正式依頼は、対象・費用・対応範囲・必要な組合加入の説明を受け、相談者が内容を確認したうえで、所定の手続きを完了した時点で成立します。正式依頼の成立前に、運営から追加の確認を求める場合があります。</p>
      ${callout("相談したことだけで、勤務先へ連絡したり、組合加入や支払いが発生したりすることはありません。", {
        tone: "soft",
        title: "相談と正式依頼は別です",
      })}

      ${h2("membership", "組合加入")}
      <p>正式依頼にあたり、運営する労働組合への加入が必要となる場合があります。加入の要否、加入する時点、加入金・会費、手続き、脱退の条件は、組合の規約に基づいて案内します。</p>
      <p>${service.membershipConditions ? escapeHtml(service.membershipConditions) : pendingInline("加入条件：確認中")}</p>
      <p>組合加入は、本サービスの正式依頼とは別の手続きです。加入の意思確認、費用の支払い、脱退の条件は、規約と実際の運用に沿って説明します。</p>

      ${h2("fees", "料金・支払い")}
      <p>相談料、退職代行の支援料、組合加入金、組合費、追加費用は、<a href="/#pricing">料金プラン</a>に表示します。実際に負担する総額、税区分、支払い方法、支払い時点は、正式依頼の前に確認できるようにします。</p>
      <p>${pricing.paymentMethods ? `支払い方法：${escapeHtml(pricing.paymentMethods.replace(/（Square:\s*https:\/\/[^\s）)]+）/, "（Square決済）"))}。` : pendingInline("支払い方法：確認中")} ${pricing.paymentTiming ? `支払い時点：${escapeHtml(pricing.paymentTiming)}。` : pendingInline("支払い時点：確認中")}</p>
      <p>${consultationFeesFree ? "AI・LINE・電話の相談料は無料です。" : "相談料は各窓口の表示をご確認ください。"} ${config.channels?.phone?.callChargeDisclosure ? escapeHtml(config.channels.phone.callChargeDisclosure) + "。" : ""}追加費用がある場合は条件と金額または計算方法を事前に表示します。</p>

      ${h2("cancellation", "取消・返金")}
      <p>${service.cancellationRefundPolicy ? escapeHtml(service.cancellationRefundPolicy) : pendingInline("取消・返金の条件：確認中")}</p>
      <p>相談のキャンセルと、正式依頼の取消・返金は別の扱いです。正式依頼後の取消・返金については、契約内容と実際の支援の進捗に応じて案内します。返金の有無・金額・手続き・時期は、正式な規約に基づきます。</p>

      ${h2("contact-policy", "勤務先への連絡")}
      <p>${service.contactPolicy ? escapeHtml(service.contactPolicy) : pendingInline("勤務先への連絡方針：確認中")}</p>
      <p>連絡が必要な場合は、誰に・いつ・どのように伝えるかを事前に説明し、本人の同意を得たうえで行います。本人の希望なしに、職場や共有の電話番号へ連絡することはありません。</p>
      <p>園への連絡が一切ないこと、退職が必ず成立すること、特定の日付で退職できることを保証するものではありません。</p>

      ${h2("prohibited", "禁止事項")}
      <p>本サービスの利用にあたり、次の行為を行わないでください。</p>
      ${bulletList([
        "虚偽の情報を提供する行為、本人になりすます行為",
        "第三者の個人情報を、本人の同意なく送信・提供する行為",
        "園児・保護者・同僚等の個人情報を、相談に必要のない形で持ち出す行為",
        "運営者・相談員・第三者への脅迫、迷惑行為、過度な要求",
        "本サービスの運営を妨げる行為、不正アクセス、システムへの負荷をかける行為",
        "法令または公序良俗に反する行為",
      ])}

      ${h2("changes", "変更・停止・免責")}
      <p>運営は、保守、障害、法令対応、運営上の必要により、本サービスの内容を変更し、または一時的に停止する場合があります。重要な変更は、本ページ等でお知らせします。</p>
      <p>本サービスは、相談内容の整理、情報提供、退職に向けた支援を行いますが、退職の成立、園との交渉結果、特定の日程、第三者による判断を保証するものではありません。AIの回答には誤りが含まれる場合があります。</p>
      <p>運営の責任の範囲、免責の条件、損害賠償の取扱いは、法令と正式な規約に基づいて定めます。${preview ? "このプレビューでは、責任範囲の最終文言を確定していません。" : ""}</p>

      ${h2("law", "準拠法・お問い合わせ")}
      <p>本利用条件は日本法に準拠し、本サービスに関する紛争は、運営が定める管轄裁判所で処理します。管轄および紛争解決の方法は、正式な規約で確定します。</p>
      ${policyTable([
        ["運営主体", operator.legalName ? escapeHtml(operator.legalName) : null],
        ["所在地", operator.address ? escapeHtml(operator.address) : null],
        ["責任者", operator.responsiblePerson ? escapeHtml(operator.responsiblePerson) : null],
        ["問い合わせ先", operator.contact ? escapeHtml(operator.contact) : null],
        ["受付時間", operator.hours ? escapeHtml(operator.hours) : null],
      ])}
      <p class="prose-note">${preview ? "このページは公開前のレビュー用です。実際の規約・契約・法令に照らして、公開前に確定します。" : "本ページは公開時点の利用条件に基づきます。"}</p>
    `,
  })}`;

  return {
    name: "terms",
    path: "/terms/",
    title: "利用条件｜保育士リトリート",
    description:
      "保育士リトリートの利用条件。相談と正式依頼の違い、組合加入、料金・支払い、取消・返金、勤務先への連絡、禁止事項、免責、お問い合わせについてまとめています。",
    body,
    stickyCta: false,
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "利用条件", path: "/terms/" },
    ],
  };
}
