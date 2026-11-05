import { escapeHtml, formatAmount } from "../../scripts/lib/html.mjs";
import { icon } from "../../scripts/lib/icons.mjs";
import {
  CHANNEL_META,
  channelButton,
  channelCardTitle,
  channelStatus,
  sectionHead,
} from "../../scripts/lib/components.mjs";

const HOME_TITLE = "保育士の退職代行・お悩み相談｜元保育士と女性カウンセラー｜保育士リトリート";
const HOME_DESCRIPTION =
  "「辞めたい」と言えずに悩む20代の保育士へ。元保育士と女性カウンセラーがLINEで無料相談。労働組合提携の退職代行で、園とのやり取りなく退職できます。料金プラン・ご利用の流れ・よくあるご質問をご案内します。";

const EMPATHY_ITEMS = [
  {
    icon: "clock",
    text: "行事や運動会、連絡帳のプレッシャーで夜も眠れない",
  },
  {
    icon: "users",
    text: "「先生なんだから」という責任感に押しつぶされそう",
  },
  {
    icon: "chat",
    text: "先輩や園長からの当たりが強く、辞めたいと言い出せない",
  },
  {
    icon: "shield",
    text: "子どもや保護者のことを考えると罪悪感で動けない",
  },
  {
    icon: "leaf",
    text: "辞めた後の生活やキャリアが不安で踏み出せない",
  },
];

const REASONS = [
  {
    icon: "users",
    title: "保育の現場を知る「元保育士」が親身に相談対応",
    body: "保育園特有の人間関係や持ち帰り残業、行事準備の過酷さを理解しているから、専門用語もそのまま伝わります。",
  },
  {
    icon: "chat",
    title: "女性カウンセラー在籍で話しやすい",
    body: "男性や威圧的な対応が苦手な方でも安心。優しく話を聞き、気持ちの整理を一緒に進めます。",
  },
  {
    icon: "leaf",
    title: "「退職ありき」ではない、優しい相談フェーズ",
    body: "「すぐに退職したい」人はもちろん、「辞めるべきか迷っている」「ただ愚痴を聞いてほしい」段階でも無料相談が可能です。",
  },
  {
    icon: "shield",
    title: "労働組合提携＆公立保育士は弁護士対応で100%安心",
    body: "園からの理不尽な引き止めや損害賠償の脅しにも法的に万全対応。退職届の郵送や貸与物の返却まで代行し、園への直接連絡は一切不要です。",
  },
];

const STEPS = [
  {
    title: "公式LINEを追加して無料相談",
    body: "「辞めたい」「辛い」の一言でもOK。今の状況やお気持ちをお聞かせください。",
  },
  {
    title: "専任カウンセラーと方針相談",
    body: "今すぐ退職手続きに進むか、まずはメンタルケア・休職にするかを一緒に考えます。",
  },
  {
    title: "退職手続きを完全代行",
    body: "ご依頼後は、あなたが園と直接やり取りすることは一切ありません。退職届の作成支援や貸与物返却もスムーズにサポートします。",
  },
  {
    title: "退職完了＆次のキャリア相談",
    body: "書類が受理されたら完了。ご希望の方には、保育士以外の道も含めた転職・キャリア支援も実施します。",
  },
];

const FAQ_ITEMS = [
  {
    question: "本当に園や保護者と話さずに辞められますか？",
    answer:
      "はい。ご本人様やご家族に直接連絡がいかないよう、代行会社から園側へしっかり伝達します。",
  },
  {
    question: "私物の引き取りや保険証・エプロンの返却はどうなりますか？",
    answer: "すべて郵送で対応可能です。園に行く必要は一切ありません。",
  },
  {
    question: "相談したことが今の職場にバレませんか？",
    answer: "秘密厳守を徹底しておりますので、職場に伝わることは絶対にありません。",
  },
  {
    question: "まだ辞めるか決めていなくても相談していいですか？",
    answer:
      "もちろんです。「話を聞いてもらって気持ちを整理したい」という段階でもお気軽にご利用ください。",
  },
  {
    question: "AIチャットと、元保育士への相談は何が違いますか？",
    answer:
      "AIチャットは、ひとりで気持ちや状況を整理するための自動応答です。元保育士・女性カウンセラーへのLINE相談は、同じ現場を経験した人間が直接お話を伺います。AIだけ、LINEだけでも利用できます。",
  },
  {
    question: "相談料はかかりますか？",
    answer:
      "AIチャット・LINE・電話の相談料は、すべて無料です。退職支援をご依頼いただく場合のみ、プランに応じた料金（24,800円〜75,000円・税込）がかかります。",
  },
];

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
  const number = key === "line" ? "01" : key === "phone" ? "02" : "03";
  const label = key === "line" ? "LINE相談（おすすめ）" : key === "phone" ? "電話相談" : "AIチャット";
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
    return `<a class="method-card method-card--${key}" href="${escapeHtml(status.href)}" data-track="consult_cta_click" data-channel="${key}" data-placement="hero"${externalAttrs}>
      ${inner}
      <span class="method-card__arrow">${icon("arrowRight")}</span>
    </a>`;
  }

  return `<div class="method-card method-card--${key} method-card--pending" aria-disabled="true" data-channel="${key}" data-placement="hero">
    ${inner}
    <span class="method-card__pending">${escapeHtml(meta.placementNote)}</span>
  </div>`;
}

function planCard(config, plan, mode) {
  const amount =
    plan.verified === true && typeof plan.amount === "number" ? formatAmount(plan.amount) : "確認中";
  return `<article class="plan-card${plan.recommended ? " plan-card--recommended" : ""}">
    ${plan.recommended ? `<p class="plan-card__badge">若手支援 特別価格</p>` : ""}
    <p class="plan-card__label">${escapeHtml(plan.label || "プラン")}</p>
    <p class="plan-card__price">${escapeHtml(amount)}<span>（税込）</span></p>
    <p class="plan-card__condition">${escapeHtml(plan.condition || "")}</p>
    <p class="plan-card__note">${escapeHtml(plan.note || "")}</p>
    ${channelButton(config, "line", {
      mode,
      placement: `plan_${plan.id || "unknown"}`,
      label: "このプランで無料相談する",
      variant: plan.recommended ? "primary" : "outline",
      showIcon: false,
    })}
  </article>`;
}

function faqItem({ question, answer, index }) {
  return `<details class="faq-item" id="faq-${String(index).padStart(2, "0")}" data-faq-id="faq-${String(index).padStart(2, "0")}">
    <summary>
      <span class="faq-item__q">${escapeHtml(question)}</span>
      <span class="faq-item__icon" aria-hidden="true"></span>
    </summary>
    <div class="faq-item__body"><p>${escapeHtml(answer)}</p></div>
  </details>`;
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
    <div class="ai-chat-chips" aria-label="相談内容の例">
      <button type="button" class="ai-chip" data-chip="年度途中ですが、精神的に限界で退職を考えています。何から整理すればいいですか？">年度途中の退職</button>
      <button type="button" class="ai-chip" data-chip="園長からの当たりが強く、直接辞めると言えません。どうすればいいですか？">園長に言えない</button>
      <button type="button" class="ai-chip" data-chip="残っている有給休暇をすべて消化して退職できますか？">有給休暇の消化</button>
      <button type="button" class="ai-chip" data-chip="私物の持ち帰りや保険証・エプロンの返却はどう進めればいいですか？">私物・保険証の返却</button>
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
  const plans = Array.isArray(config.pricing?.plans) ? config.pricing.plans : [];
  const taxNote = config.pricing?.taxNote
    ? escapeHtml(config.pricing.taxNote)
    : "表示金額は税込です。";
  const paymentNote = config.pricing?.paymentMethods
    ? escapeHtml(config.pricing.paymentMethods)
    : "支払い方法はご相談時にご案内します。";

  const body = `
  <section class="hero hero--retreat" aria-labelledby="hero-title">
    <div class="hero__wash" aria-hidden="true"></div>
    <div class="container hero__grid">
      <div class="hero__copy">
        <p class="hero__eyebrow"><span class="hero__eyebrow-rule" aria-hidden="true"></span>保育士特化の、やさしい退職・お悩み相談</p>
        <h1 id="hero-title"><span class="hero__h1-line">もう、一人で</span><span class="hero__h1-line">抱え込まなくて大丈夫。</span><span class="hero__h1-line hero__h1-line--accent">あなたが辞めても、<br class="hero__br">絶対に大丈夫です。</span></h1>
        <p class="hero__quote">「子どもは好き。でも、もう限界かもしれない。」</p>
        <p class="hero__lead">保育士特化の優しい退職・お悩み相談サービス【保育士リトリート】<br>元保育士と女性カウンセラーが、あなたのペースでお話を伺います。</p>
        <div class="hero__actions hero__actions--cta">
          ${channelButton(config, "line", {
            mode,
            placement: "hero",
            label: "まずはLINEで無料相談（24時間受付）",
            variant: "primary",
            className: "button--hero",
          })}
          <a class="button button--outline" href="#pricing">今すぐ退職手続きを頼みたい方はこちら ${icon("arrowDown")}</a>
        </div>
        <div class="hero__illustration-wrapper">
          <picture>
            <source srcset="/assets/hero-illustration-1200.webp" type="image/webp">
            <img class="hero__illustration" src="/assets/hero-illustration.jpg" alt="温かいお茶を手にホッと一息つく保育士の優しいイラスト" width="560" height="370" loading="eager" decoding="async">
          </picture>
        </div>
        <ul class="hero-badges" aria-label="サービスの特徴">
          <li>${icon("users")} 元保育士が相談対応</li>
          <li>${icon("chat")} 女性カウンセラー在籍</li>
          <li>${icon("yen")} 相談料 0円（完全無料）</li>
          <li>${icon("shield")} 労働組合提携（退職成功率100%）</li>
        </ul>
        <p class="hero__note">${icon("info")} 人に話すのがまだ怖いときは、AIチャットでひとりで整理することもできます。</p>
      </div>
      <aside class="hero-panel" aria-labelledby="hero-panel-title">
        <div class="hero-panel__head">
          <p class="hero-panel__kicker">CONTACT / 3 WAYS</p>
          <h2 id="hero-panel-title">相談方法を選ぶ</h2>
          <p>話しやすい方法から始められます。</p>
        </div>
        <div class="method-stack">
          ${heroMethodCard(config, "line", mode)}
          ${heroMethodCard(config, "phone", mode)}
          ${heroMethodCard(config, "ai", mode)}
        </div>
        <div class="hero-panel__qr" data-pc-only>
          <img class="hero-panel__qr-img" src="/assets/line-qr.png" alt="LINE友だち追加QRコード" width="76" height="76" loading="eager" decoding="async">
          <div class="hero-panel__qr-text">
            <p class="hero-panel__qr-title">PCの方はスマホでQR読み取り</p>
            <p class="hero-panel__qr-sub">LINE追加ですぐ相談できます<br><span class="hero-panel__qr-id">公式LINE ID: @897zpkws</span></p>
          </div>
        </div>
        <p class="hero-panel__foot">相談しただけでは、正式依頼や組合加入にはなりません。</p>
      </aside>
    </div>
    <div class="container hero__foot">
      <div class="hero__trust" aria-label="サービスの特徴">
        <span>${icon("shield")} 労働組合が運営</span>
        <span>${icon("users")} 元保育士・女性カウンセラーが対応</span>
        <span>${icon("yen")} 相談料は完全無料</span>
      </div>
      <a class="hero__scroll" href="#worries">お悩みを読む ${icon("arrowDown")}</a>
    </div>
  </section>

  <section class="section section--empathy" id="worries" aria-labelledby="empathy-title">
    <div class="container">
      ${sectionHead({
        number: "01",
        eyebrow: "お悩み",
        title: "こんな毎日、<br>限界を感じていませんか？",
        lead: "ひとつでも当てはまったら、それはあなたががんばりすぎているサインかもしれません。",
        id: "empathy-title",
      })}
      <ul class="empathy-list">
        ${EMPATHY_ITEMS.map(
          (item) => `<li class="empathy-item">
          <span class="empathy-item__icon">${icon(item.icon)}</span>
          <p>${escapeHtml(item.text)}</p>
          <span class="empathy-item__check" aria-hidden="true">${icon("check")}</span>
        </li>`,
        ).join("")}
      </ul>
      <div class="empathy-cta">
        <p>「私のことだ」と思ったら、まずは誰かに話してみてください。</p>
        ${channelButton(config, "line", {
          mode,
          placement: "empathy",
          label: "LINEで無料相談する",
          variant: "primary",
        })}
      </div>
    </div>
  </section>

  <section class="section section--retreat" id="retreat" aria-labelledby="retreat-title">
    <div class="container retreat-layout">
      <div class="retreat-layout__visual">
        <picture>
          <source srcset="/assets/relax-healing-illustration-1200.webp" type="image/webp">
          <img class="retreat-layout__image" src="/assets/relax-healing-illustration.jpg" alt="自然の中で深呼吸して心が軽やかになる保育士と小鳥の優しいイラスト" width="540" height="360" loading="eager" decoding="async">
        </picture>
      </div>
      <div class="retreat-layout__content">
        <p class="retreat-layout__eyebrow">RETREAT / 休息と相談</p>
        <h2 id="retreat-title">あなたが責任を感じる必要は、<br>ひとつもありません。</h2>
        <p>「リトリート（Retreat）」とは、忙しい日常から少し離れ、心と身体をリセットすること。</p>
        <p>あなたの心と身体の健康よりも大切な仕事はありません。まずは一度立ち止まって、深呼吸してみませんか？</p>
        <p class="retreat-layout__note">悩んだり、立ち止まったり、次の道を探すことは決して逃げではありません。まずは、がんばってきたご自身に「おつかれさま」を。</p>
      </div>
    </div>
  </section>

  <section class="section section--talk" id="talk" aria-labelledby="talk-title">
    <div class="container">
      ${sectionHead({
        number: "02",
        eyebrow: "相談のイメージ",
        title: "LINEでのやり取りは、<br>こんな感じです。",
        lead: "「相談って、どんなふうに返ってくるの？」その不安をなくすために、やり取りのイメージを掲載しています。",
        id: "talk-title",
      })}
      <div class="talk-layout">
        <div class="talk-visual">
          <div class="talk-phone" role="img" aria-label="LINE相談のやり取りイメージ。相談者の『園長が怖くて、辞めたいって言えません…』に、カウンセラーが『よく話してくれました。それはとても苦しかったですね』と返信しています。">
            <div class="talk-phone__head">
              <span class="talk-phone__avatar">保</span>
              <div>
                <strong>保育士リトリート</strong>
                <span>元保育士・女性カウンセラー</span>
              </div>
            </div>
            <div class="talk-phone__body">
              <p class="talk-bubble talk-bubble--user">園長が怖くて、辞めたいって言えません…</p>
              <p class="talk-bubble talk-bubble--counselor">よく話してくれました。それはとても苦しかったですね。</p>
              <p class="talk-bubble talk-bubble--counselor">辞めるかどうかを決める前に、まずは気持ちを整理するところから始めましょう。</p>
              <p class="talk-bubble talk-bubble--user">こんなこと相談してもいいんですか？</p>
              <p class="talk-bubble talk-bubble--counselor">もちろんです。あなたのペースで大丈夫ですよ。</p>
            </div>
            <div class="talk-phone__input">メッセージを入力…</div>
          </div>
          <div class="talk-counselor-preview" aria-hidden="true">
            <picture>
              <source srcset="/assets/consult-warm-illustration-640.webp" type="image/webp">
              <img class="talk-counselor-preview__img" src="/assets/consult-warm-illustration.jpg" alt="保育士のお悩みに優しく耳を傾ける女性カウンセラーのイラスト" width="340" height="254" loading="eager" decoding="async">
            </picture>
            <p class="talk-counselor-preview__label">${icon("users")} 同じ保育現場を経験したスタッフが、あなたのお気持ちを否定せず大切に受け止めます。</p>
          </div>
        </div>
        <div class="talk-copy">
          <h3>返信するのは、元保育士と女性カウンセラー。</h3>
          <p>保育の現場を知るスタッフだから、行事準備の忙しさも、園長への伝えにくさも、説明なしで伝わります。</p>
          <ul class="talk-points">
            <li>${icon("check")} 「辞める」と決めていなくても相談OK</li>
            <li>${icon("check")} 退職を無理に勧めることはありません</li>
            <li>${icon("check")} 秘密厳守。職場に伝わることはありません</li>
          </ul>
          <p class="talk-fine">※この画面はやり取りのイメージです。実際の返信内容を保証するものではありません。</p>
          ${channelButton(config, "line", {
            mode,
            placement: "talk",
            label: "LINEで無料相談する",
            variant: "primary",
          })}
        </div>
      </div>
    </div>
  </section>

  <section class="section section--reasons" id="reasons" aria-labelledby="reasons-title">
    <div class="container">
      ${sectionHead({
        number: "03",
        eyebrow: "選ばれる理由",
        title: "「保育士リトリート」が<br>選ばれる4つの理由",
        lead: "事務的な退職代行ではなく、まずは悩みを吐き出せる場所でありたい。それが私たちの考えです。",
        id: "reasons-title",
      })}
      <div class="reason-grid">
        ${REASONS.map(
          (reason, index) => `<article class="reason-card">
          <div class="reason-card__head">
            <span class="reason-card__num">${String(index + 1).padStart(2, "0")}</span>
            <span class="reason-card__icon">${icon(reason.icon)}</span>
          </div>
          <h3>${escapeHtml(reason.title)}</h3>
          <p>${escapeHtml(reason.body)}</p>
        </article>`,
        ).join("")}
      </div>
    </div>
  </section>

  <section class="section section--steps" id="flow" aria-labelledby="steps-title">
    <div class="container">
      ${sectionHead({
        number: "04",
        eyebrow: "ご利用の流れ",
        title: "相談から退職までの<br>カンタン4ステップ",
        lead: "まずはLINEで気持ちを送るところから。退職するかどうかは、話しながら決めていけます。",
        id: "steps-title",
      })}
      <ol class="step-grid">
        ${STEPS.map(
          (step, index) => `<li class="step-card">
          <span class="step-card__num">STEP ${index + 1}</span>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.body)}</p>
        </li>`,
        ).join("")}
      </ol>
      <p class="steps-note">${icon("info")} 相談したこと、LINEを追加したことは、正式依頼や組合加入への同意ではありません。決めるのは、あなた自身です。</p>
    </div>
  </section>

  <section class="section section--plans" id="pricing" aria-labelledby="plans-title">
    <div class="container">
      ${sectionHead({
        number: "05",
        eyebrow: "料金",
        title: "明朗な料金プラン",
        lead: "相談はすべて無料。退職支援をご依頼いただく場合のみ、以下の料金がかかります。",
        id: "plans-title",
      })}
      <div class="plan-grid">
        ${plans.map((plan) => planCard(config, plan, mode)).join("")}
      </div>
      <div class="plan-assurance">
        <span>${icon("shield")} 全額返金保証</span>
        <span>${icon("yen")} あと払い対応</span>
        <span>${icon("check")} 追加料金一切なし</span>
      </div>
      <p class="plan-note">${taxNote}。お支払い方法：${paymentNote}。正式なお申し込み・着手前にお支払いいただきます。</p>
      <p class="plan-links"><a href="/disclosures/">取引条件・事業者情報を見る ${icon("arrowRight")}</a></p>
    </div>
  </section>

  <section class="section section--voices" id="voices" aria-labelledby="voices-title">
    <div class="container">
      ${sectionHead({
        number: "06",
        eyebrow: "ご利用者の声",
        title: "実際に相談された方の、<br>リアルなエピソード",
        lead: "掲載にあたり、ご本人から許可をいただいています。",
        id: "voices-title",
      })}
      <div class="voice-grid">
        <figure class="voice-card">
          <blockquote>園長が怖くて言い出せず体調を崩していました。元保育士のカウンセラーさんが「それは辛かったね」と共感してくれて涙が出ました。園長と一言も話さずに即日退職できました。</blockquote>
          <figcaption><span class="voice-card__meta">Case 1</span>20代・私立保育園勤務</figcaption>
        </figure>
        <figure class="voice-card">
          <blockquote>退職するか悩んでいた段階でLINE相談しました。無理に退職を勧められることもなく、自分のペースで決断できたのが本当にありがたかったです。</blockquote>
          <figcaption><span class="voice-card__meta">Case 2</span>20代・持ち帰り残業過多</figcaption>
        </figure>
      </div>
      <p class="voice-note">※個人が特定されないよう、一部の表現を調整しています。</p>
    </div>
  </section>

  <section class="section section--ai" id="consult" aria-labelledby="ai-section-title">
    <div class="container">
      ${sectionHead({
        number: "07",
        eyebrow: "AIチャット",
        title: "人に話す前に、<br>ひとりで整理したい方へ",
        lead: "「まだ人に話す勇気が出ない」「自分の気持ちを文字にして確かめたい」という方は、保育特化AIチャットでいつでも自由に整理できます。",
        id: "ai-section-title",
      })}
      ${aiChatPanel()}
      <p class="section-fine">AIは、人に相談するための必須ステップではありません。AIを経由しないと、人に相談できない構造にはしていません。LINE・電話は、どちらも直接選べます。</p>
    </div>
  </section>

  <section class="section section--faq" id="faq" aria-labelledby="faq-title">
    <div class="container faq-layout">
      <div class="faq-intro">
        ${sectionHead({
          number: "08",
          eyebrow: "よくあるご質問",
          title: "よくあるご質問",
          lead: "相談前に確認したい、連絡・返却・秘密厳守・料金についてまとめました。",
          id: "faq-title",
        })}
        <a class="text-link" href="#consult">それでも迷うときは、相談方法を見る ${icon("arrowRight")}</a>
      </div>
      <div class="faq-list">
        ${FAQ_ITEMS.map((item, index) => faqItem({ ...item, index: index + 1 })).join("")}
      </div>
    </div>
  </section>

  <section class="section section--closing" id="closing" aria-labelledby="closing-title">
    <div class="container">
      <div class="closing-head">
        <p class="eyebrow eyebrow--light"><span class="eyebrow__num">09</span><span class="eyebrow__label">相談開始</span></p>
        <h2 id="closing-title">明日からの朝を、<br>少しでも穏やかな気持ちで<br>迎えるために。</h2>
        <p>秘密厳守・24時間受付。相談料は無料です。まずは今の気持ちを、そのまま送ってください。</p>
      </div>
      <div class="closing-actions closing-actions--line">
        <div class="closing-action closing-action--primary">
          ${channelButton(config, "line", {
            mode,
            placement: "closing",
            label: "LINEで無料相談する（秘密厳守・24時間受付中）",
            variant: "light-primary",
            className: "button--hero",
          })}
          <p>相談しただけでは、正式依頼や組合加入にはなりません。</p>
        </div>
        <div class="closing-qr" data-pc-only>
          <img class="closing-qr__img" src="/assets/line-qr.png" alt="LINE友だち追加QRコード" width="92" height="92" loading="lazy" decoding="async">
          <div class="closing-qr__text">
            <strong>スマホで読み取り相談</strong>
            <span>公式LINE ID: @897zpkws</span>
          </div>
        </div>
      </div>
      <div class="closing-foot">
        <p>相談料は無料です。退職支援の料金は、プランに応じて24,800円〜75,000円（税込）です。</p>
        <p>運営：${operator.legalName ? escapeHtml(operator.legalName) : "労働組合"}</p>
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
