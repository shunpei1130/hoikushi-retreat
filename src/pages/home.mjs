import { escapeHtml, formatAmount } from "../../scripts/lib/html.mjs";
import { icon } from "../../scripts/lib/icons.mjs";
import {
  CHANNEL_META,
  channelButton,
  channelCardTitle,
  channelStatus,
  sectionHead,
} from "../../scripts/lib/components.mjs";

const HOME_TITLE = "保育士が辞めたい時の退職代行・無料相談｜元保育士と女性カウンセラー｜保育士リトリート";
const HOME_DESCRIPTION =
  "「保育士を辞めたい」「園長が怖くて言い出せない」「年度途中の引き継ぎが不安」と悩む保育士さん専門の退職代行・無料相談窓口【保育士リトリート】。元保育士と女性カウンセラーが24時間LINEで無料相談に対応。労働組合運営（公立は弁護士対応）で園と直接話さず郵送完結で退職をサポートします。";

const EMPATHY_ITEMS = [
  {
    icon: "clock",
    html: '行事や運動会、連絡帳の<span class="u-ib">プレッシャー</span>で<span class="u-ib">夜も眠れない</span>',
  },
  {
    icon: "users",
    html: '「先生なんだから」という責任感に<span class="u-ib">押しつぶされそう</span>',
  },
  {
    icon: "chat",
    html: '先輩や園長からの当たりが強く、<span class="u-ib">辞めたいと言い出せない</span>',
  },
  {
    icon: "shield",
    html: '子どもや保護者のことを考えると<span class="u-ib">罪悪感で動けない</span>',
  },
  {
    icon: "info",
    html: '年度途中や担任の<span class="u-ib">引き継ぎが気になり、</span><span class="u-ib">言い出す時期がわからない</span>',
  },
  {
    icon: "leaf",
    html: '辞めた後の生活やキャリアが不安で<span class="u-ib">一歩を踏み出せない</span>',
  },
];

const REASONS = [
  {
    icon: "users",
    titleHtml: '保育の現場を知る「元保育士」が<span class="u-ib">親身に相談対応</span>',
    body: "保育園特有の人間関係や持ち帰り残業、行事準備の過酷さを理解しているから、専門用語もそのまま伝わります。",
  },
  {
    icon: "chat",
    titleHtml: '女性カウンセラー在籍で<span class="u-ib">安心して話せる</span>',
    body: "男性や威圧的な対応が苦手な方でも安心。優しく話を聞き、気持ちの整理を一緒に進めます。",
  },
  {
    icon: "leaf",
    titleHtml: '「退職ありき」ではない、<span class="u-ib">優しい相談フェーズ</span>',
    body: "「すぐに退職したい」人はもちろん、「辞めるべきか迷っている」「ただ愚痴を聞いてほしい」段階でも無料相談が可能です。",
  },
  {
    icon: "shield",
    titleHtml: '労働組合提携＆公立保育士は<span class="u-ib">弁護士対応で安心</span>',
    body: "園からの理不尽な引き止めや損害賠償の脅しにも法的に万全対応。退職届の郵送や貸与物の返却までサポートし、園への直接連絡は不要です。",
  },
];

const STEPS = [
  {
    icon: "chat",
    tag: "無料・24時間受付",
    titleHtml: '公式LINEを<span class="u-ib">友だち追加</span>',
    bodyHtml:
      "まずは公式LINEを追加します。すぐにご依頼したい方はもちろん、「まだ迷っている」段階の無料相談だけでもOKです。",
    point: "相談料 0円・追加だけでも安心",
  },
  {
    icon: "document",
    tag: "Googleフォーム",
    titleHtml: 'ヒアリングシート<span class="u-ib">（Googleフォーム）を記入</span>',
    bodyHtml:
      'LINEでご案内するヒアリングシート<span class="u-ib">（Googleフォーム）</span>に、勤務先の情報やご希望の退職日などをスマホから入力します。',
    point: "スマホ完結・長い電話ヒアリング不要",
  },
  {
    icon: "yen",
    tag: "クレカ・あと払い",
    titleHtml: '料金のお支払いで<span class="u-ib">ご依頼完了</span>',
    bodyHtml:
      "プランに応じた料金をお支払いいただいたら、あなたのお手続きは完了です。追加料金は一切かかりません。",
    point: "全額返金保証・組合費もすべて込み",
  },
];

const FAQ_ITEMS = [
  {
    question: "「保育士を辞めたい」と悩む年度途中や1年目でも、退職代行を使えますか？",
    answer:
      "はい、年度途中や新卒1年目、クラス担任をお持ちの保育士さんでも問題なく退職代行をご利用いただけます。当組合（公立保育園は提携弁護士）が園長への連絡から退職日の調整、引き継ぎや返却物の郵送手配まで代行するため、園と直接やり取りせずに退職可能です。",
  },
  {
    question: "申し込みの手続きは難しくありませんか？",
    answer:
      "とてもシンプルです。公式LINEを追加後、ご案内するヒアリングシート（Googleフォーム）をご記入いただき、プランに応じた料金をお支払いいただくだけでお手続き完了です。お支払い後は、当組合（公立の場合は提携弁護士）が園への連絡や調整を進めます。",
  },
  {
    question: "本当に園や保護者と話さずに辞められますか？",
    answer:
      "はい。ご本人様やご家族に直接連絡がいかないよう、当組合（公立の場合は提携弁護士）から園側へしっかり伝達します。",
  },
  {
    question: "私物の引き取りや保険証・エプロンの返却はどうなりますか？",
    answer: "すべて郵送で対応可能です。手続きのために園へ足を運ぶ必要はありません。",
  },
  {
    question: "相談したことが今の職場にバレませんか？",
    answer: "秘密厳守を徹底しております。ご本人の説明と同意なく勤務先へ連絡することは一切ありません。",
  },
  {
    question: "まだ辞めるか決めていなくても相談していいですか？",
    answer:
      "もちろんです。「まずは話を聞いてもらって気持ちを整理したい」という段階でも、どうぞお気軽にご利用ください。",
  },
  {
    question: "AIチャットと、元保育士への相談は何が違いますか？",
    answer:
      "AIチャットは、ひとりで気持ちや状況を整理するための自動応答です。元保育士・女性カウンセラーへのLINE・電話相談は、同じ現場を経験した人間が直接お話を伺います。AIだけ、LINEだけでも利用できます。",
  },
  {
    question: "相談料はかかりますか？",
    answer:
      "AIチャット・LINE・電話の相談料は、すべて無料です。退職支援を正式にご依頼いただく場合のみ、プランに応じた料金（24,800円〜75,000円・税込）がかかります。",
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

function formatPaymentMethodsHtml(raw) {
  if (!raw) return "ご相談時にご案内します。";
  const squareMatch = /^(.*?)（Square:\s*(https:\/\/[^\s）)]+)）(.*)$/.exec(raw);
  if (squareMatch) {
    const [, before, url, after] = squareMatch;
    return `${escapeHtml(before)}（<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Square決済</a>）${escapeHtml(after)}`;
  }
  return escapeHtml(raw);
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
    <span class="method-card__sub">${
      key === "ai"
        ? 'まずは質問や気持ちをひとりで<span class="u-ib">整理したい方へ</span>'
        : key === "line"
          ? '文字で自分の状況を<span class="u-ib">ゆっくり伝えたい方へ</span>'
          : config.channels?.phone?.requestViaLine === true
            ? 'LINE追加後、<span class="u-ib">「電話相談希望」と送信してください</span>'
            : '声で話しながら<span class="u-ib">相談したい方へ</span>'
    }</span>
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

function planFeatureText(plan) {
  if (plan.id === "youth") return "退職連絡・組合費込み／追加料金なし";
  if (plan.id === "standard") return "正社員・契約社員・パート等すべて対応";
  if (plan.id === "public") return "提携弁護士が対応／公立園の手続き一式";
  return plan.note || "追加料金なし";
}

function planCard(config, plan, mode) {
  const amount =
    plan.verified === true && typeof plan.amount === "number" ? formatAmount(plan.amount) : "確認中";
  const feature = planFeatureText(plan);
  return `<article class="plan-card${plan.recommended ? " plan-card--recommended" : ""}">
    ${plan.recommended ? `<p class="plan-card__badge">おすすめ・若手支援特別価格</p>` : ""}
    <h3 class="plan-card__label">${escapeHtml(plan.label || "プラン")}</h3>
    <p class="plan-card__price"><span class="u-ib">${escapeHtml(amount)}<span>（税込）</span></span></p>
    <dl class="plan-card__details">
      <div><dt>対象</dt><dd>${escapeHtml(plan.condition || "保育士の方")}</dd></div>
      <div><dt>内容</dt><dd>${escapeHtml(feature)}</dd></div>
    </dl>
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
      <span class="faq-item__q-badge" aria-hidden="true">Q</span>
      <span class="faq-item__q">${escapeHtml(question)}</span>
      <span class="faq-item__icon" aria-hidden="true"></span>
    </summary>
    <div class="faq-item__body"><p>${escapeHtml(answer)}</p></div>
  </details>`;
}

function aiChatPanel() {
  return `<section class="ai-chat-panel" id="ai-chat" aria-labelledby="ai-chat-title">
    <div class="ai-chat-panel__intro">
      <p class="ai-chat-panel__eyebrow">AI CHAT｜24時間・匿名・無料</p>
      <h3 id="ai-chat-title">保育の悩みを、チャットで整理する</h3>
      <p>退職や園での働き方について、状況を整理するためのAIチャットです。AIの回答には誤りが含まれる場合があり、法律判断や正式な支援の確約はできません。</p>
    </div>
    <div class="ai-chat-panel__conversation" data-ai-chat-log role="log" aria-label="AIとの会話" aria-live="polite" aria-relevant="additions text">
      <p class="ai-chat-message ai-chat-message--assistant">こんにちは。まずは、今いちばん整理したいことを教えてください。氏名や園名など、個人が特定できる情報は書かないでください。</p>
    </div>
    <div class="ai-chat-chips-wrap">
      <p class="ai-chat-chips__label">よくある相談テーマ（タップで入力欄に入ります）</p>
      <div class="ai-chat-chips" aria-label="相談内容の例">
        <button type="button" class="ai-chip" data-chip="年度途中ですが、精神的に限界で退職を考えています。何から整理すればいいですか？">年度途中の退職</button>
        <button type="button" class="ai-chip" data-chip="園長からの当たりが強く、直接辞めると言えません。どうすればいいですか？">園長に言えない</button>
        <button type="button" class="ai-chip" data-chip="残っている有給休暇をすべて消化して退職できますか？">有給休暇の消化</button>
        <button type="button" class="ai-chip" data-chip="私物の持ち帰りや保険証・エプロンの返却はどう進めればいいですか？">私物・保険証の返却</button>
      </div>
    </div>
    <form class="ai-chat-form" data-ai-chat-form action="/api/chat" method="post">
      <label for="ai-chat-input">相談内容を入力</label>
      <textarea id="ai-chat-input" name="message" rows="3" maxlength="1500" required placeholder="例：年度途中で退職を考えています。何から整理すればよいですか？"></textarea>
      <p class="ai-chat-form__privacy">※氏名・園名・園児・保護者・同僚の個人情報は入力しないでください。送信内容は回答生成のためOpenAI APIへ送られます。</p>
      <div class="ai-chat-form__actions">
        <button class="button button--primary" type="submit" data-ai-chat-submit>AIに質問する ${icon("arrowRight")}</button>
        <span class="ai-chat-form__status" data-ai-chat-status role="status" aria-live="polite"></span>
      </div>
    </form>
    <p class="ai-chat-panel__fine">このチャットは自動応答（相談無料）です。人に相談したい場合は、AIを使わずLINEや電話相談を選べます。会話の取扱いは<a href="/privacy/">個人情報の取扱い</a>をご確認ください。</p>
    <noscript><p class="ai-chat-panel__noscript">AIチャットにはJavaScriptが必要です。JavaScriptを利用できない場合は、LINE相談をご利用ください。</p></noscript>
  </section>`;
}

export function renderHome({ config, mode }) {
  const operator = config.operator ?? {};
  const plans = Array.isArray(config.pricing?.plans) ? config.pricing.plans : [];
  const paymentHtml = formatPaymentMethodsHtml(config.pricing?.paymentMethods);
  const timingNote = config.pricing?.paymentTiming
    ? escapeHtml(config.pricing.paymentTiming)
    : "ご相談後、正式なお申し込み・着手前にお支払い";

  const body = `
  <section class="hero hero--retreat" aria-labelledby="hero-title">
    <div class="hero__wash" aria-hidden="true"></div>
    <div class="container hero__grid">
      <div class="hero__head">
        <p class="hero__eyebrow"><span class="hero__eyebrow-dot" aria-hidden="true"></span>労働組合運営｜保育士特化の退職代行・やさしいお悩み相談</p>
        <h1 id="hero-title"><span class="sr-only">保育士が辞めたい時の退職代行・無料相談（保育士リトリート）｜</span><span class="hero__h1-line">もう、一人で<span class="u-ib">抱え込まなくて大丈夫。</span></span><span class="hero__h1-line hero__h1-line--accent">あなたが辞めても、<br class="hero__br"><span class="u-ib">絶対に大丈夫です。</span></span></h1>
      </div>

      <div class="hero__visual">
        <figure class="hero-figure">
          <picture>
            <source srcset="/assets/hero-illustration-720.webp 720w, /assets/hero-illustration-1200.webp 1200w" sizes="(max-width: 980px) 92vw, 480px" type="image/webp">
            <img class="hero__illustration" src="/assets/hero-illustration.jpg" alt="温かいお茶を手にホッと一息つく保育士の優しいイラスト" width="1200" height="670" loading="eager" fetchpriority="high" decoding="async">
          </picture>
        </figure>
      </div>

      <div class="hero__body">
        <div class="hero-card">
          <p class="hero-card__quote">「子どもは好き。<span class="u-ib">でも、もう限界かもしれない。」</span></p>
          <p class="hero-card__lead">「保育士を辞めたい」と悩む方のための、優しい退職代行・お悩み相談窓口<strong class="u-ib">【保育士リトリート】</strong>です。元保育士と女性カウンセラーが、あなたのペースでお話を伺います。</p>
          <ul class="hero-badges" aria-label="サービスの特徴">
            <li>${icon("users")}<span>元保育士が相談対応</span></li>
            <li>${icon("chat")}<span>女性カウンセラー在籍</span></li>
            <li>${icon("yen")}<span>相談料0円・完全無料</span></li>
            <li>${icon("shield")}<span>労働組合提携で安心</span></li>
          </ul>
          <div class="hero-card__cta">
            <p class="hero-cta-box__micro"><span>秘密厳守</span><span class="dot" aria-hidden="true"></span><span>24時間受付</span><span class="dot" aria-hidden="true"></span><span>迷っている段階でもOK</span></p>
            <div class="hero__actions hero__actions--cta">
              ${channelButton(config, "line", {
                mode,
                placement: "hero",
                label: "まずはLINEで無料相談する",
                variant: "primary",
                className: "button--hero",
              })}
              <a class="button button--outline" href="#pricing"><span>料金・サポート内容を見る</span>${icon("arrowDown")}</a>
            </div>
          </div>
        </div>
      </div>

      <aside class="hero-panel" aria-labelledby="hero-panel-title">
        <div class="hero-panel__head">
          <p class="hero-panel__kicker">CONTACT / 3 WAYS</p>
          <h2 id="hero-panel-title">相談方法を選ぶ</h2>
          <p>話しやすい窓口から、無料で始められます。</p>
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
            <p class="hero-panel__qr-sub">LINE追加ですぐ相談できます <span class="hero-panel__qr-id">公式LINE ID: @897zpkws</span></p>
          </div>
        </div>
        <p class="hero-panel__foot">${icon("info")}<span>相談しただけでは、正式依頼や<span class="u-ib">組合加入にはなりません。</span></span></p>
      </aside>
    </div>
  </section>

  <section class="section section--empathy" id="worries" aria-labelledby="empathy-title">
    <div class="container">
      ${sectionHead({
        number: "01",
        eyebrow: "保育士を辞めたいお悩みチェック",
        title: '<span class="sr-only">保育士を辞めたいと悩む方へ：</span>こんな毎日、<br>限界を<span class="u-ib">感じていませんか？</span>',
        lead: "ひとつでも当てはまったら、それはあなたががんばりすぎているサインかもしれません。",
        id: "empathy-title",
      })}
      <ul class="empathy-list">
        ${EMPATHY_ITEMS.map(
          (item) => `<li class="empathy-item">
          <span class="empathy-item__icon">${icon(item.icon)}</span>
          <p>${item.html}</p>
          <span class="empathy-item__check" aria-hidden="true">${icon("check")}</span>
        </li>`,
        ).join("")}
      </ul>
      <div class="empathy-cta">
        <div class="empathy-cta__copy">
          <span class="empathy-cta__badge">ひとつでも当てはまる方へ</span>
          <p>「私のことだ」と思ったら、一人で抱え込まずに<span class="u-ib">まずは誰かに話してみてください。</span></p>
        </div>
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
    <div class="container">
      <div class="retreat-card">
        <div class="retreat-card__visual">
          <picture>
            <source srcset="/assets/relax-healing-illustration-720.webp 720w, /assets/relax-healing-illustration-1200.webp 1200w" sizes="(max-width: 900px) 92vw, 480px" type="image/webp">
            <img class="retreat-card__image" src="/assets/relax-healing-illustration.jpg" alt="自然の中で深呼吸して心が軽やかになる保育士と小鳥の優しいイラスト" width="1200" height="670" loading="lazy" decoding="async">
          </picture>
        </div>
        <div class="retreat-card__content">
          <p class="retreat-card__eyebrow">RETREAT / 休息と相談</p>
          <h2 id="retreat-title">あなたが責任を<span class="u-ib">感じる必要は、</span><br><span class="u-ib">ひとつもありません。</span></h2>
          <p>「リトリート（Retreat）」とは、忙しい日常から少し離れ、心と身体を<span class="u-ib">リセットすること。</span></p>
          <p>あなたの心と身体の健康よりも大切な仕事はありません。まずは一度立ち止まって、<span class="u-ib">深呼吸してみませんか？</span></p>
          <p class="retreat-card__note">悩んだり、立ち止まったり、次の道を探すことは決して逃げではありません。まずは、がんばってきたご自身に<span class="u-ib">「おつかれさま」を。</span></p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--talk" id="talk" aria-labelledby="talk-title">
    <div class="container">
      ${sectionHead({
        number: "02",
        eyebrow: "LINE相談のイメージ",
        title: 'LINEでのやり取りは、<br><span class="u-ib">こんな感じです。</span>',
        lead: "「相談って、どんなふうに返ってくるの？」という不安をなくすために、実際のやり取りに近いイメージを掲載しています。",
        id: "talk-title",
      })}
      <div class="talk-layout">
        <div class="talk-visual">
          <div class="talk-phone" role="img" aria-label="LINE相談のやり取りイメージ。相談者の『園長が怖くて、辞めたいって言えません…』に、カウンセラーが『よく話してくれました。それはとても苦しかったですね』と返信しています。">
            <div class="talk-phone__head">
              <img class="talk-phone__avatar" src="/assets/favicon-96.png" alt="" width="38" height="38" loading="lazy" decoding="async">
              <div class="talk-phone__title">
                <strong>保育士リトリート</strong>
                <span class="talk-phone__sub">元保育士・女性カウンセラー</span>
              </div>
            </div>
            <div class="talk-phone__body">
              <span class="talk-phone__date">今日</span>
              <p class="talk-bubble talk-bubble--user">園長が怖くて、辞めたいって<span class="u-ib">言えません…</span></p>
              <p class="talk-bubble talk-bubble--counselor">よく話してくれました。それはとても<span class="u-ib">苦しかったですね。</span></p>
              <p class="talk-bubble talk-bubble--counselor">辞めるかどうかを決める前に、まずは気持ちを整理するところから<span class="u-ib">始めましょう。</span></p>
              <p class="talk-bubble talk-bubble--user">こんなこと相談してもいいんですか？</p>
              <p class="talk-bubble talk-bubble--counselor">もちろんです。あなたのペースで<span class="u-ib">大丈夫ですよ。</span></p>
            </div>
            <div class="talk-phone__input">メッセージを入力…</div>
          </div>
          <p class="talk-fine">※この画面はやり取りのイメージです。実際の返信内容を保証するものではありません。</p>
        </div>

        <div class="talk-card">
          <div class="talk-card__media">
            <picture>
              <source srcset="/assets/consult-warm-illustration-640.webp 640w, /assets/consult-warm-illustration-960.webp 960w" sizes="(max-width: 900px) 92vw, 500px" type="image/webp">
              <img class="talk-card__img" src="/assets/consult-warm-illustration.jpg" alt="保育士のお悩みに優しく耳を傾ける女性カウンセラーのイラスト" width="960" height="716" loading="lazy" decoding="async">
            </picture>
          </div>
          <div class="talk-card__body">
            <p class="talk-card__badge">COUNSELOR / 対応スタッフ</p>
            <h3>返信するのは、<span class="u-ib">元保育士と女性カウンセラー。</span></h3>
            <p>保育の現場を知るスタッフだから、行事準備の忙しさも、園長への伝えにくさも、説明なしでそのまま伝わります。</p>
            <ul class="talk-points">
              <li>${icon("check")}<span>「辞める」と決めていなくても相談OK</span></li>
              <li>${icon("check")}<span>退職を無理に勧めることはありません</span></li>
              <li>${icon("check")}<span>秘密厳守。職場に伝わることはありません</span></li>
            </ul>
            ${channelButton(config, "line", {
              mode,
              placement: "talk",
              label: "LINEで無料相談する",
              variant: "primary",
            })}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--reasons" id="reasons" aria-labelledby="reasons-title">
    <div class="container">
      ${sectionHead({
        number: "03",
        eyebrow: "保育士の退職代行で選ばれる理由",
        title: '<span class="sr-only">保育士の退職代行・無料相談で</span><span class="u-ib">「保育士リトリート」</span>が<br>選ばれる4つの理由',
        lead: "事務的な退職代行ではなく、まずは悩みを安心して吐き出せる場所でありたい。それが私たちの考えです。",
        id: "reasons-title",
      })}
      <div class="reason-grid">
        ${REASONS.map(
          (reason, index) => `<article class="reason-card">
          <div class="reason-card__head">
            <span class="reason-card__num">REASON ${String(index + 1).padStart(2, "0")}</span>
            <span class="reason-card__icon">${icon(reason.icon)}</span>
          </div>
          <h3>${reason.titleHtml}</h3>
          <p>${escapeHtml(reason.body)}</p>
        </article>`,
        ).join("")}
      </div>
    </div>
  </section>

  <section class="section section--plans" id="pricing" aria-labelledby="plans-title">
    <div class="container">
      ${sectionHead({
        number: "04",
        eyebrow: "退職代行の料金プラン",
        title: '<span class="sr-only">保育士退職代行の</span>明朗な料金プラン',
        lead: "AI・LINE・電話でのご相談はすべて無料。退職支援を正式にご依頼いただく場合のみ、以下の料金がかかります。",
        id: "plans-title",
      })}
      <div class="plan-grid">
        ${plans.map((plan) => planCard(config, plan, mode)).join("")}
      </div>
      <div class="plan-info-card">
        <div class="plan-assurance">
          <span>${icon("shield")} 全額返金保証</span>
          <span>${icon("yen")} あと払い対応</span>
          <span>${icon("check")} 追加料金一切なし</span>
        </div>
        <dl class="plan-info-list">
          <div>
            <dt>費用に含まれるもの</dt>
            <dd>退職支援料・労働組合加入金・組合費すべて総額に含まれます（相談料0円・追加のサービス料金なし）。</dd>
          </div>
          <div>
            <dt>お支払い方法</dt>
            <dd>${paymentHtml}</dd>
          </div>
          <div>
            <dt>お支払い時期・保証</dt>
            <dd>${timingNote}。万一退職が成立しなかった場合は全額返金いたします。</dd>
          </div>
        </dl>
        <p class="plan-links"><a class="text-link" href="/disclosures/">取引条件・事業者情報を見る ${icon("arrowRight")}</a></p>
      </div>
    </div>
  </section>

  <section class="section section--steps" id="flow" aria-labelledby="steps-title">
    <div class="container">
      ${sectionHead({
        number: "05",
        eyebrow: "退職代行ご利用の流れ",
        title: '<span class="sr-only">保育士退職代行の</span>ご依頼の流れは、<br><span class="u-ib">かんたん3ステップ</span>',
        lead: '複雑な書類手続きや長い電話ヒアリングはありません。公式LINE追加後、ヒアリングシート<span class="u-ib">（Googleフォーム）</span>を記入して、料金をお支払いいただくだけです。',
        id: "steps-title",
      })}
      <ol class="step-grid">
        ${STEPS.map(
          (step, index) => `<li class="step-card">
          <div class="step-card__top">
            <div class="step-card__badges">
              <span class="step-card__num">STEP 0${index + 1}</span>
              <span class="step-card__tag">${escapeHtml(step.tag)}</span>
            </div>
            <span class="step-card__icon">${icon(step.icon)}</span>
          </div>
          <h3>${step.titleHtml}</h3>
          <p>${step.bodyHtml}</p>
          <p class="step-card__point">${icon("check")}<span>${escapeHtml(step.point)}</span></p>
          ${index < STEPS.length - 1 ? `<span class="step-card__arrow" aria-hidden="true">${icon("arrowRight")}</span>` : ""}
        </li>`,
        ).join("")}
      </ol>
      <div class="flow-complete">
        <div class="flow-complete__body">
          <span class="flow-complete__badge">${icon("shield")} お支払い後はすべておまかせ</span>
          <p class="flow-complete__title">園への連絡・退職手続きの調整は、<span class="u-ib">当組合がすべて代行します。</span></p>
          <p class="flow-complete__desc">ご希望の日時に合わせて当組合（公立保育園は提携弁護士）から園へ連絡します。あなたが園と直接やり取りする必要はありません。<span class="flow-complete__fine">※LINE追加や無料相談だけでは、料金や組合加入は発生しません。</span></p>
        </div>
        <div class="flow-complete__cta">
          ${channelButton(config, "line", {
            mode,
            placement: "flow",
            label: "LINEを友だち追加する",
            variant: "primary",
          })}
        </div>
      </div>
    </div>
  </section>

  <section class="section section--voices" id="voices" aria-labelledby="voices-title">
    <div class="container">
      ${sectionHead({
        number: "06",
        eyebrow: "ご利用者の声",
        title: '実際に相談された方の、<br><span class="u-ib">リアルなエピソード</span>',
        lead: "掲載にあたり、ご本人から許可をいただいています。",
        id: "voices-title",
      })}
      <div class="voice-grid">
        <figure class="voice-card">
          <figcaption class="voice-card__head">
            <span class="voice-card__meta">Case 01</span>
            <span class="voice-card__who">20代・私立保育園勤務</span>
          </figcaption>
          <blockquote>園長が怖くて言い出せず体調を崩していました。元保育士のカウンセラーさんが「それは辛かったね」と共感してくれて涙が出ました。園長と一言も話さずに退職手続きを進められました。</blockquote>
        </figure>
        <figure class="voice-card">
          <figcaption class="voice-card__head">
            <span class="voice-card__meta">Case 02</span>
            <span class="voice-card__who">20代・持ち帰り残業過多</span>
          </figcaption>
          <blockquote>退職するか悩んでいた段階でLINE相談しました。無理に退職を勧められることもなく、自分のペースで決断できたのが本当にありがたかったです。</blockquote>
        </figure>
      </div>
      <p class="voice-note">※個人が特定されないよう、ご本人の同意のもと一部の表現を調整しています。</p>
    </div>
  </section>

  <section class="section section--ai" id="consult" aria-labelledby="ai-section-title">
    <div class="container">
      ${sectionHead({
        number: "07",
        eyebrow: "AIチャット",
        title: '人に話す前に、<br><span class="u-ib">ひとりで整理したい方へ</span>',
        lead: '「まだ人に話す勇気が出ない」「自分の気持ちを文字にして確かめたい」という方は、<span class="u-ib">保育特化AIチャット</span>でいつでも自由に整理できます。',
        id: "ai-section-title",
      })}
      ${aiChatPanel()}
      <div class="human-path-card">
        <span class="human-path-card__badge">${icon("info")} ご利用にあたって</span>
        <p>AIは、人に相談するための必須ステップではありません。AIを経由しないと、人に相談できない構造にはしていません。LINE・電話は、どちらも直接選べます。</p>
      </div>
    </div>
  </section>

  <section class="section section--faq" id="faq" aria-labelledby="faq-title">
    <div class="container faq-layout">
      <div class="faq-intro">
        ${sectionHead({
          number: "08",
          eyebrow: "よくあるご質問",
          title: '<span class="sr-only">保育士の退職代行・辞めたい相談の</span>よくあるご質問',
          lead: "相談前に確認しておきたい、園への連絡・返却物・秘密厳守・料金についてまとめました。",
          id: "faq-title",
        })}
        <div class="faq-help-box">
          <p>ここに記載のない疑問や、個別の雇用契約についても無料でお答えします。</p>
          <a class="text-link" href="#talk">LINE相談のイメージを見る ${icon("arrowRight")}</a>
        </div>
      </div>
      <div class="faq-list">
        ${FAQ_ITEMS.map((item, index) => faqItem({ ...item, index: index + 1 })).join("")}
      </div>
    </div>
  </section>

  <section class="section section--closing" id="closing" aria-labelledby="closing-title">
    <div class="container">
      <div class="closing-grid">
        <div class="closing-head">
          <p class="eyebrow eyebrow--light"><span class="eyebrow__num">09</span><span class="eyebrow__label">相談開始</span></p>
          <h2 id="closing-title">明日からの朝を、<br>少しでも穏やかな気持ちで<br><span class="u-ib">迎えるために。</span></h2>
          <p>秘密厳守・24時間受付。相談料は無料です。<span class="u-ib">まずは今の気持ちを、</span><span class="u-ib">そのまま送ってください。</span></p>
          <ul class="closing-pills" aria-label="安心のポイント">
            <li>${icon("shield")} 秘密厳守</li>
            <li>${icon("clock")} 24時間受付</li>
            <li>${icon("yen")} 相談料 0円</li>
          </ul>
        </div>
        <div class="closing-card">
          <p class="closing-card__kicker">公式LINE 無料相談窓口</p>
          ${channelButton(config, "line", {
            mode,
            placement: "closing",
            label: "まずはLINEで無料相談する",
            variant: "light-primary",
            className: "button--hero",
          })}
          <p class="closing-card__note">相談しただけでは、正式依頼や<span class="u-ib">組合加入にはなりません。</span></p>
          <div class="closing-qr" data-pc-only>
            <img class="closing-qr__img" src="/assets/line-qr.png" alt="LINE友だち追加QRコード" width="84" height="84" loading="lazy" decoding="async">
            <div class="closing-qr__text">
              <strong>PCの方はスマホでQR読み取り</strong>
              <span>公式LINE ID: @897zpkws</span>
            </div>
          </div>
        </div>
      </div>
      <div class="closing-foot">
        <p>相談料は無料です。退職支援の料金は、プランに応じて<span class="u-ib">24,800円〜75,000円（税込）</span>です。</p>
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
    faqs: FAQ_ITEMS,
    steps: [
      {
        name: "公式LINEを友だち追加",
        text: "まずは公式LINEを追加します。すぐにご依頼したい方はもちろん、「まだ迷っている」段階の無料相談だけでもOKです。",
      },
      {
        name: "ヒアリングシート（Googleフォーム）を記入",
        text: "LINEでご案内するヒアリングシート（Googleフォーム）に、勤務先の情報やご希望の退職日などをスマホから入力します。",
      },
      {
        name: "料金のお支払いでご依頼完了",
        text: "プランに応じた料金をお支払いいただいたら、あなたのお手続きは完了です。追加料金は一切かかりません。",
      },
    ],
    images: [
      {
        path: "/assets/og-image.png",
        title: "保育士リトリート｜保育士特化のやさしい退職・お悩み相談窓口",
      },
      {
        path: "/assets/hero-illustration.jpg",
        title: "温かいお茶を手にホッと一息つく保育士の優しいイラスト",
      },
      {
        path: "/assets/relax-healing-illustration.jpg",
        title: "自然の中で深呼吸して心が軽やかになる保育士と小鳥の優しいイラスト",
      },
      {
        path: "/assets/consult-warm-illustration.jpg",
        title: "保育士のお悩みに優しく耳を傾ける女性カウンセラーのイラスト",
      },
    ],
  };
}
