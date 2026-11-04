# 検証結果

実施日：2026-11-04。対象はローカルの静的出力です。自動監査・レイアウト測定は実際の業務、法務、外部サービス、検索順位を保証しません。


> 引き継ぎ資料 `docs/HANDOFF.md` は2026-11-04に、調査したソース・設定・テスト・監査結果に基づいて作成しました。内容の正確性は、その時点のリポジトリ状態に対応します。

## 引き継ぎ資料

- [HANDOFF.md](HANDOFF.md) — 他のAI／実装者へ渡す、調査時点の構成・制約・承認ゲート・確認質問。
- この文書と一体で読んでください。HANDOFF内の検証結果は、ここに記載した結果に対応します。

## 結果サマリー

| 検証 | 結果 | 記録 |
|---|---|---|
| Node.js | `v24.11.1`（要件は20以上） | `package.json` |
| プレビュー生成 | 成功。6ページ。ブロッカー36件（未設定35・不整合1）、警告3件 | `dist/preview/`、`docs/PRELAUNCH.md` |
| テスト | **16 passed / 0 failed** | `node --test tests/config.test.mjs tests/build.test.mjs tests/chat.test.mjs` |
| プレビュー静的監査 | **6ページ、0 errors / 0 warnings** | `docs/verification/audit.json` |
| 本番ゲート（現行設定） | 期待どおり停止。テストで出力を作らないことも確認 | `tests/build.test.mjs` |
| 本番モードのfixture監査 | **6ページ、0 errors / 0 warnings**。合成fixture専用で、実サイトではない | `docs/verification/audit-fixture-production.json` |
| AIチャットAPIルート | ローカルとVercel handlerで未設定キー時503を確認。モックAPIテストでGPT-6 LunaへのResponses API形式・`store:false`を確認。実OpenAI APIには接続していない | `tests/chat.test.mjs`、ローカルHTTP確認 |
| Vercelビルド設定 | `scripts/vercel-build.mjs` でPreview出力を生成し静的監査。実Vercelへのデプロイは未実施 | `vercel.json`、ローカルビルド結果 |
| 画面幅レイアウト | 360 / 390 / 430 / 768 / 1280 / 1440pxで水平スクロールのはみ出し0px。監査対象コントロールの44px未満0件 | `docs/verification/layout-audit.json` |
| 下層ページのレイアウト | `/about/`、`/privacy/`、`/terms/`、`/disclosures/`、`/404.html` を390 / 1440pxで確認。水平はみ出し0px | 同上 |
| ローカルHTTP | `GET /` は200、存在しないパスは404 | ローカルNodeプレビューサーバーで確認。実ホストでは未確認 |

## 実行した検証

```powershell
node scripts/build.mjs
node --test tests/config.test.mjs tests/build.test.mjs tests/chat.test.mjs
node scripts/audit.mjs
node scripts/vercel-build.mjs
node scripts/audit.mjs --dir=dist/vercel-output --mode=preview --out=.tmp/audit-vercel-output.json --screenshots=screenshots/preview
node scripts/build.mjs --production --config=tests/fixtures/complete.config.json --out=dist/audit-production --docs-out=.tmp/audit-production-prelaunch.md
node scripts/audit.mjs --dir=dist/audit-production --mode=production --out=docs/verification/audit-fixture-production.json --screenshots=screenshots/preview
node scripts/screenshots.mjs
```

テスト用の `dist/audit-production/` とVercel Preview出力 `dist/vercel-output/` は監査後に削除し、公開候補として残していません。fixture監査JSONはテスト記録のため保管しています。`tests/fixtures/complete.config.json` の値はすべて本番利用不可の合成データです。

テスト16件では、プレビューの `noindex` と確認中表示、fixture設定でのproductionビルド、未確認の現行設定でのproduction停止、設定検証、料金計算、未検証窓口リンクの抑止、placeholder検出、origin正規化、チャット入力検証、ローカル/Vercel関数の未設定キー応答、OpenAI APIリクエストのモック等を確認しています。料金の計算テストはfixtureデータの算術検証であり、実価格を表しません。

## スクリーンショット

`node scripts/screenshots.mjs` がローカルChromeのCDP経由で38枚を生成しました。

- `screenshots/preview/width-{360,390,430,768,1280,1440}.png` — ホーム全体、6幅
- `screenshots/preview/hero-{390x844,1440x900}.png` — ファーストビュー
- `screenshots/preview/section-{390,1440}-*.png` — ホームの10セクション、各2幅
- `screenshots/preview/page-{about,privacy,terms,disclosures,404}-{390,1440}.png` — 下層5ページ、各2幅

追加でファーストビュー、チャットフォーム、相談カード、料金サマリー、FAQ、スタッフ紹介、取引条件ページを目視しました。360 / 390 / 430pxでは3つの相談方法が初期画面内に表示されています。768×900では電話カードの下端が初期画面より下に続きます（ページ幅のはみ出しではありません）。LINEのQR画像ファイルはまだ未配置のため、プレビューは明示的な追加待ち表示です。

「44px未満なし」はスクリーンショットスクリプトの指定セレクターに対する測定値であり、全操作要素のアクセシビリティ適合判定ではありません。

## 未検証・未実施

- AIチャットの実接続、回答品質、入力情報の保存・学習利用
- `.env` に実キーを設定した状態でのOpenAI API接続、モデル利用可否、実利用料金・上限
- 本番ホスト上での `/api/chat` 配信、強固なレート制限、シークレット管理、ログと利用上限
- Vercelプロジェクトへの実デプロイ、Deployment Protection、Vercel上での環境変数・Function動作
- Production向けVercelビルドは現在の公開ゲート36件により停止すること（Previewビルドのみローカル検証）
- LINEの送信・返信、実電話、通話料・予約の実運用
- `@897zpkws` の実アカウント確認、QR画像配置後の実機読み取り
- 決済、申込み、組合加入、取消・返金、職場への連絡
- 組合情報、スタッフの実在性・経歴・掲載同意、料金・規約の法務確認
- 実ホスティングでの `_headers` 反映、HTTPS、キャッシュ、リダイレクト、実際の200/404
- DNS、ドメイン所有、Search Console、検索インデックス、検索順位
- スクリーンリーダー、キーボード全経路、200%拡大、JavaScript無効時の手動操作
- Chrome以外の実ブラウザー・実端末、Lighthouse、Core Web Vitals、実ユーザー性能
- アクセス解析ベンダーとの連携、同意管理、実イベントの送信・保存
- 公開、広告設定、DNS変更、実問い合わせ、実送信、通話、支払い、加入

APIキーを設定した場合、OpenAI APIの利用料はそのキーに紐づくアカウントへ発生します。キーは共有せず、GitHubへコミットしないでください。静的ファイルだけのGitHub Pagesでは `/api/chat` は動作しません。

この一覧の項目は合格扱いにしていません。公開可否は [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) と自動生成の [PRELAUNCH.md](PRELAUNCH.md) を参照してください。
