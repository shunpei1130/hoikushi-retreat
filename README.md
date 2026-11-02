# 保育士リトリート｜静的LP

レビュー用の静的LPと、OpenAI APIをサーバー側から呼び出すローカルNode/Vercelチャット関数です。現状は**公開不可のプレビュー**であり、運営情報・窓口の稼働確認・料金内訳・スタッフ・法務情報などが未確認です。本番ビルドは必要情報と承認が揃うまで停止します。Vercelへのデプロイ、DNS変更、広告変更、実際のLINE送信・通話・決済・組合加入は行っていません。

## 納品物

- `src/` — 6ページのHTML生成元、CSS、必要最小限のJavaScript、アイコン類
- `api/chat.js` — Vercelの同一オリジン `/api/chat` Function
- `vercel.json` / `scripts/vercel-build.mjs` — VercelのPreview/Productionビルド設定
- `dist/preview/` — `noindex` と確認中表示を含むレビュー用静的出力
- `site.config.json` — 運営・相談窓口・料金・法務・承認情報の一元設定。未確認値は `null` または未承認フラグ
- `.env.example` — OpenAI APIキーの入力例。実キーはローカルの `.env` のみ
- `screenshots/preview/` — 38枚の画面キャプチャ
- `docs/PRELAUNCH.md` — ビルド時に自動生成される全ブロッカー一覧
- `docs/LAUNCH-CHECKLIST.md` — 公開前の実務チェック
- `docs/EVIDENCE-LEDGER.md` — 表示内容の根拠と承認状態
- `docs/VERIFICATION.md` と `docs/verification/` — テスト・監査・レイアウトの記録

ページは `/`、`/about/`、`/privacy/`、`/terms/`、`/disclosures/`、`/404.html` です。承認済みの記事がないため、ガイド記事は作成していません。

## ローカルでプレビュー

必要なのは Node.js 20 以上です。依存パッケージはありません。AIチャットを動かすには、OpenAI APIキーが必要です。プロジェクト直下（`package.json` と同じ場所）で次を実行し、作られた `.env` にキーを入力します。

```powershell
Copy-Item .env.example .env
notepad .env
node scripts/build.mjs
node scripts/serve.mjs --dir=dist/preview --port=4173 --host=127.0.0.1
```

`.env` の `OPENAI_API_KEY=` の右側にキーを入力してください。`OPENAI_MODEL` は `gpt-6-luna` を初期設定しているため、そのままで構いません。保存後にサーバーを起動または再起動し、`http://127.0.0.1:4173/` を開きます。キーはブラウザーへ渡さず、GitHubにも含めない設定です。キーをチャットやIssueへ貼らないでください。API利用料はOpenAI APIアカウントに発生します。

`.env` がない場合、ページは表示されますが、チャット送信時に「未設定」と返します。`site.config.json` にキーを書かないでください。

## 検証コマンド

```powershell
node --test tests/config.test.mjs tests/build.test.mjs tests/chat.test.mjs
node scripts/audit.mjs
node scripts/screenshots.mjs
```

スクリーンショット生成にはローカルの Chrome または Edge が必要です。見つからない場合は `CHROME_PATH` を設定します。検証結果の詳細と未検証項目は [docs/VERIFICATION.md](docs/VERIFICATION.md) を参照してください。

## 設定変更

1. `site.config.json` を編集します。`null` は未確認、`false` は未承認・未検証または初期無効を表します。
2. 事業者・担当者の一次情報と、実際の業務・規約を照合します。
3. 接続先は許可されたテスト範囲でのみ確認し、確認完了前に `verified` を `true` にしないでください。
4. 料金は各項目、税区分、支払時点、組合費、追加費用、総額を照合します。未確認額を `0円` にしないでください。
5. 変更後にプレビュー、テスト、監査を再実行し、[docs/EVIDENCE-LEDGER.md](docs/EVIDENCE-LEDGER.md) と確認資料を更新します。

`tests/fixtures/complete.config.json` はテスト専用の合成データです。実在する事業者情報・料金・相談先として使ったり、本番設定へコピーしたりしないでください。

LINE IDは `@897zpkws` です。電話相談はLINE追加後に「電話相談希望」と送信する流れです。添付QR画像は `src/assets/line-qr.png` に置くと、次のビルドでページに表示されます。現在そのファイルはまだ配置されていないため、プレビューではQR画像の追加待ち表示です。生成したQRではなく、提供された画像そのものを配置してください。

退職支援の税込総額は、ご指定の「就業から6年以内」の場合に24,800円として表示し、AI・LINE・電話の相談料は無料としています。6年の境界判定は行わず、料金内訳やその他の適用条件は未確認のまま本番ゲートに残しています。電話の通話料等は相談料と分けて確認してください。

## 本番ビルドのゲート

```powershell
node scripts/build.mjs --production
```

成功時の出力先は `dist/public/` です。現在の設定では未確認項目のため失敗するのが正しい動作です。失敗時は `docs/PRELAUNCH.md` を確認してください。出力先に以前のファイルが残っている場合、失敗したビルドはそれを消さずに警告します。古い出力を公開しないでください。

承認後にのみ、公開出力を監査します。

```powershell
node scripts/audit.mjs --dir=dist/public --mode=production --out=docs/verification/audit-public.json --screenshots=screenshots/preview
```

現在の `site.config.json` から公開用成果物は生成していません。`docs/verification/audit-fixture-production.json` はテスト用の合成設定を使ったゲート検証の記録であり、実データ・公開承認・本番サイトの証明ではありません。

### Vercelのプレビューへデプロイする場合（未実施）

Vercel用の `api/chat.js` 関数と `vercel.json` を追加済みです。VercelプロジェクトのRoot Directoryをこの `hoiku-retreat-lp` フォルダにし、Preview用Environment Variablesに `OPENAI_API_KEY` を登録してください。`OPENAI_MODEL` は省略可能で、既定値は `gpt-6-luna` です。`.env` をGitHubへ置く必要はありません。

`vercel.json` は `scripts/vercel-build.mjs` を呼び、Previewでは `dist/vercel-output/` の `noindex` 出力と `/api/chat` Functionを構成します。Production環境では本番ビルドゲートが動き、現状の50件のブロッカーが解消されるまで失敗します。Preview URLはVercel Deployment Protection等で保護してください。`noindex` はアクセス制御ではありません。

Vercel FunctionのインメモリIP制限は簡易的なベストエフォートで、スケール環境での本番用レート制限として十分ではありません。一般公開前に、Vercel側のレート制限・利用上限・予算通知、ログの取り扱い、HTTPS、OpenAI側のデータ条件を確認してください。Vercelへの実デプロイ・実API呼び出しは行っていません。

## 公開・切り戻しの手順（未実施）

ホスティング先が未確定のため、特定サービス向けのデプロイ手順はありません。明示的な公開承認が得られた後に限り、静的ファイルに加えて `/api/chat` を提供するNodeバックエンドを同一オリジンで構成してください。ホストがディレクトリURL、404、`_headers` をどう扱うか、HTTPS、canonical、robots、sitemap、キャッシュ設定も検証します。

公開時は直前の正常版を保持し、障害時はホスティング側のリリース切替または保存済み正常版へ戻す手順を事前に決めます。DNS・広告・外部サービス設定の変更は別途承認なしに行いません。このプロジェクトではデプロイも切り戻しも実施していません。

## 参照

- [公開チェックリスト](docs/LAUNCH-CHECKLIST.md)
- [根拠台帳](docs/EVIDENCE-LEDGER.md)
- [検証結果と未検証事項](docs/VERIFICATION.md)
- [自動生成の公開ブロッカー一覧](docs/PRELAUNCH.md)
