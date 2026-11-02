import { escapeHtml, pendingInline } from "../../scripts/lib/html.mjs";
import { bulletList, callout, h2, pageHero, pageLayout, policyTable } from "./shared.mjs";

export function renderPrivacy({ config, mode }) {
  const legal = config.legal ?? {};
  const operator = config.operator ?? {};
  const preview = mode !== "production";
  const operatorName = operator.legalName ? escapeHtml(operator.legalName) : pendingInline("組合正式名称：確認中");

  const body = `${pageHero({
    eyebrow: "個人情報 / PRIVACY",
    title: "個人情報と、<br>相談情報の取扱い。",
    lead: "保育士リトリートが取得する情報、利用目的、AI・LINE・電話・アクセス解析の取扱い、保存と削除、お問い合わせ窓口をまとめています。",
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "個人情報の取扱い", path: "/privacy/" },
    ],
    meta: `施行日：${legal.privacyEffectiveDate ? escapeHtml(legal.privacyEffectiveDate) : "公開前に確定"}`,
  })}
  ${pageLayout({
    preview,
    updatedAt: config.contentUpdatedAt,
    toc: [
      { id: "policy", label: "基本方針" },
      { id: "collect", label: "取得する情報" },
      { id: "purpose", label: "利用目的" },
      { id: "ai", label: "AIチャット" },
      { id: "line-phone", label: "LINE・電話相談" },
      { id: "analytics", label: "アクセス解析・Cookie" },
      { id: "third-party", label: "第三者提供・委託" },
      { id: "retention", label: "保存期間・削除" },
      { id: "requests", label: "開示等の請求" },
      { id: "contact", label: "お問い合わせ・改定" },
    ],
    body: `
      ${h2("policy", "基本方針")}
      <p>保育士リトリート（以下「本サービス」）は、${operatorName}が運営する退職相談・退職代行サービスです。相談には、氏名・勤務先・健康状態・退職理由などの個人情報や、機微な事情が含まれる場合があります。取得する情報を必要な範囲に限り、利用目的を明確にして取り扱います。</p>
      <p>本ページの内容は、実際の委託関係・外部サービスの仕様・保存期間・法令上の義務を確認したうえで確定します。公開前に、運営責任者による承認と必要な法務確認を行います。</p>
      ${policyTable([
        ["施行日", legal.privacyEffectiveDate ? escapeHtml(legal.privacyEffectiveDate) : null],
        ["運営主体", operator.legalName ? escapeHtml(operator.legalName) : null],
        ["個人情報に関する問い合わせ先", legal.privacyContact ? escapeHtml(legal.privacyContact) : null],
        ["相談情報の保存期間", legal.retentionPeriod ? escapeHtml(legal.retentionPeriod) : null],
        ["保存情報の削除方法", legal.deletionMethod ? escapeHtml(legal.deletionMethod) : null],
        ["AI外部サービスの提供事業者", legal.aiProvider ? escapeHtml(legal.aiProvider) : null],
        ["LINE外部サービスの提供事業者", legal.lineProvider ? escapeHtml(legal.lineProvider) : null],
        ["アクセス解析事業者", config.analytics?.enabled === true && legal.analyticsProvider ? escapeHtml(legal.analyticsProvider) : "アクセス解析は初期状態では無効です"],
        ["ホスティング事業者", legal.hostingProvider ? escapeHtml(legal.hostingProvider) : null],
      ])}

      ${h2("collect", "取得する情報")}
      <p>本LPの初回閲覧では、氏名・園名・健康状態・退職理由の入力を求めません。次の方法で、相談者が任意に送信・入力した情報を取得する場合があります。</p>
      ${bulletList([
        "AIチャット：質問文、相談者が入力した状況・希望などの情報。回答生成のためOpenAI APIへ送信します。氏名・園名・園児や保護者の個人情報は入力しないよう案内します。",
        "LINE相談：LINEの表示名、メッセージ内容、画像等、相談者が送信した情報。",
        "電話相談：通話で話された内容、折り返しのための連絡先等、相談対応に必要な情報。",
        "お問い合わせ：問い合わせ本文、連絡先等、回答に必要な情報。",
        "技術情報：IPアドレス、ブラウザ情報、アクセス日時等、配信・セキュリティのためにサーバーが記録する情報。",
      ])}
      <p>相談に必要のない個人情報は、最初から入力を求めません。園児・保護者・同僚等の個人情報を、本人の同意なく送信しないよう案内します。</p>

      ${h2("purpose", "利用目的")}
      <p>取得した情報は、次の目的の範囲で利用します。</p>
      ${bulletList([
        "相談への回答、状況の整理、支援の可否・範囲・費用の案内",
        "正式依頼の受付、本人確認、連絡内容の確認、退職に向けた調整",
        "組合加入に関する手続き、必要な書類・日程の案内",
        "相談対応の品質向上、FAQ・案内文の改善（個人が特定されない形に加工したうえで行います）",
        "法令上の義務の履行、不正アクセス・迷惑行為への対応",
      ])}
      <p>上記以外の目的で利用する場合は、あらかじめ本人へ説明し、必要に応じて同意を得ます。相談内容を、広告のオーディエンス作成や、本人の同意がない営業目的で利用しません。</p>

      ${h2("ai", "AIチャット")}
      <p>保育特化AIチャットは、このページ内の入力内容をサーバー側からOpenAI APIへ送信して回答を表示します。AIは自動応答であり、元保育士などの人による回答ではありません。AIの回答には誤りが含まれる場合があります。個別の対応や正式なご依頼は、組合担当者が確認します。</p>
      <p>提供事業者：${legal.aiProvider ? escapeHtml(legal.aiProvider) : pendingInline("AI提供事業者：確認中")}。会話履歴はチャット中にブラウザー上で一時保持し、アプリケーションのデータベースには保存しない設計です。回答生成ごとに直近の会話内容をOpenAI APIへ送信します。APIリクエストは応答保存を無効にする設定で送信しますが、OpenAI側のデータ取扱い・保存条件と、ホスティング事業者の通信ログは公開前に確認します。</p>
      ${callout(
        "氏名、園名、園児・保護者の個人情報は入力しないでください。AIの会話を、本人の同意なく組合側へ自動共有することはありません。",
        { tone: "warn", title: "AIに入力しないでほしい情報" },
      )}
      <p>AIから人への相談を希望する場合は、LINE・電話を選べます。電話相談はLINE追加後に「電話相談希望」と送信する流れです。AIの利用は、人に相談するための必須条件ではありません。</p>

      ${h2("line-phone", "LINE・電話相談")}
      <p>LINE相談では、LINEの表示名・メッセージ・送信された画像等を、相談対応のために取得します。LINEの利用には、LINE提供事業者の規約・プライバシーポリシーが適用されます。${legal.lineProvider ? `提供事業者：${escapeHtml(legal.lineProvider)}。` : pendingInline("LINE提供事業者：確認中")}</p>
      <p>電話相談では、通話内容と、折り返しに必要な連絡先等を取得する場合があります。相談料は無料です。通話料等の通信費が利用者負担となるか、誰が発信するかは、実際の電話相談の進め方を確認して公開前に確定します。</p>
      <p>LINEの友だち追加、メッセージ送信、電話の発信、AIへの質問は、正式依頼や組合加入への同意として扱いません。正式依頼・加入・支払いは、それぞれ別の手続きとして案内します。</p>

      ${h2("analytics", "アクセス解析・Cookie")}
      <p>本LPは、初期状態ではアクセス解析を有効にしていません。解析を有効化する場合は、取得する項目、利用目的、保存期間、委託先、同意の方法を定め、このページに表示します。</p>
      <p>相談内容、LINEの表示名、電話番号、組合の加入状況等を、アクセス解析へ送信しません。解析の同意と、正式依頼・組合加入の同意を混ぜません。</p>
      <p>本LPは、表示に必要な範囲を除き、Cookieを使用しません。外部のAIチャット・LINEへ遷移した後は、各サービスのCookie・プライバシーポリシーが適用されます。</p>

      ${h2("third-party", "第三者提供・委託")}
      <p>法令に基づく場合、または本人の同意がある場合を除き、取得した個人情報を第三者へ提供しません。相談対応・システム運用・アクセス解析等を外部事業者へ委託する場合は、委託先を選定し、必要最小限の情報だけを取り扱わせ、契約・監督を行います。</p>
      <p>AI・LINE・電話・ホスティング等の外部サービスについては、実際の提供関係と委託範囲を確認し、このページと各サービスの表示を一致させます。</p>

      ${h2("retention", "保存期間・削除")}
      <p>相談情報の保存期間は、${legal.retentionPeriod ? escapeHtml(legal.retentionPeriod) : pendingInline("保存期間：確認中")}。法令上の保存義務、相談対応の継続性、本人からの削除請求への対応を踏まえて定めます。</p>
      <p>保存期間の経過後、または本人から削除の請求があった場合は、${legal.deletionMethod ? escapeHtml(legal.deletionMethod) : pendingInline("削除方法：確認中")}により削除します。削除できない合理的な理由がある場合は、その理由を本人へ説明します。</p>
      ${preview ? `<p class="prose-note">${pendingInline("保存・削除の条件：確認中")} このプレビューでは、実際の保存先・期間・削除手順を確定していません。</p>` : ""}

      ${h2("requests", "開示等の請求")}
      <p>本人または代理人は、法令に基づき、保有個人データの開示・訂正・追加・利用停止・削除等を請求できます。請求の際は、本人確認を行ったうえで、法令に定める期間内に対応します。手続きの詳細と窓口は、公開前に確定します。</p>
      <p>相談内容に第三者の個人情報が含まれる場合、開示等の請求に応じる際は、第三者の権利利益を損なわない範囲で対応します。</p>

      ${h2("contact", "お問い合わせ・改定")}
      ${policyTable([
        ["個人情報に関する問い合わせ先", legal.privacyContact ? escapeHtml(legal.privacyContact) : null],
        ["受付時間", operator.hours ? escapeHtml(operator.hours) : null],
        ["運営主体", operator.legalName ? escapeHtml(operator.legalName) : null],
        ["所在地", operator.address ? escapeHtml(operator.address) : null],
        ["責任者", operator.responsiblePerson ? escapeHtml(operator.responsiblePerson) : null],
      ])}
      <p>本ページの内容を変更する場合は、変更内容と施行日をこのページに表示します。重要な変更を行う場合は、必要に応じて相談者へ分かりやすい方法でお知らせします。</p>
      <p class="prose-note">${preview ? "このページは公開前のレビュー用です。実際の運用・委託先・保存期間・法令上の義務に照らして、公開前に確定します。" : "本ページは公開時点の運用に基づきます。"}</p>
    `,
  })}`;

  return {
    name: "privacy",
    path: "/privacy/",
    title: "個人情報・相談情報の取扱い｜保育士リトリート",
    description:
      "保育士リトリートにおける個人情報・相談情報の取扱い、AIチャット・LINE・電話・アクセス解析の利用、保存期間・削除、開示等の請求、お問い合わせ窓口をまとめています。",
    body,
    stickyCta: false,
    breadcrumbs: [
      { label: "ホーム", path: "/" },
      { label: "個人情報の取扱い", path: "/privacy/" },
    ],
  };
}
