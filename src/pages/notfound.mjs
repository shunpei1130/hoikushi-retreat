import { icon } from "../../scripts/lib/icons.mjs";

export function renderNotFound({ config }) {
  const body = `<section class="notfound" aria-labelledby="notfound-title">
    <div class="container notfound__inner">
      <p class="eyebrow"><span class="eyebrow__num">404</span><span class="eyebrow__label">NOT FOUND</span></p>
      <h1 id="notfound-title">ページが見つかりません。</h1>
      <p class="notfound__lead">URLが変更されたか、ページが削除された可能性があります。下のリンクから、必要な情報を確認してください。</p>
      <div class="notfound__actions">
        <a class="button button--primary" href="/">トップページへ ${icon("arrowRight")}</a>
        <a class="button button--outline" href="/#consult">3つの相談方法を見る ${icon("arrowRight")}</a>
      </div>
      <nav class="notfound__links" aria-label="主なページ">
        <a href="/#pricing">料金と組合加入</a>
        <a href="/#faq">よくあるご質問</a>
        <a href="/about/">運営情報</a>
        <a href="/privacy/">個人情報の取扱い</a>
      </nav>
    </div>
  </section>`;

  return {
    name: "notfound",
    path: "/404.html",
    title: "ページが見つかりません｜保育士リトリート",
    description: "お探しのページは見つかりませんでした。保育士リトリートのトップページ、相談方法、料金、運営情報へのリンクを案内します。",
    body,
    stickyCta: false,
    noindex: true,
    breadcrumbs: [{ label: "ホーム", path: "/" }, { label: "ページが見つかりません", path: "/404.html" }],
  };
}
