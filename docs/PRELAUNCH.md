# 公開ブロッカー・未確認項目

> このファイルは `scripts/build.mjs` により自動生成されています。手動編集はビルドで上書きされます。
>
> - モード: **production**
> - 生成: 2026-11-04 08:15:07 UTC
> - 設定ファイル: `site.config.json`
> - 公開ドメイン: `https://hoikushi-retreat.vercel.app`
> - 公開ブロッカー: **0件**（未設定 0 / 不整合 0）
> - 警告: **3件**

## 公開ブロッカー

なし

## 警告

<table>
  <thead><tr><th>区分</th><th>設定キー</th><th>項目</th><th>状態</th></tr></thead>
  <tbody>
    <tr><td>計測</td><td><code>analytics.enabled</code></td><td>アクセス解析</td><td>初期状態では無効です。有効化にはプライバシー承認が必要です</td></tr>
    <tr><td>解説記事</td><td><code>guides</code></td><td>解説記事</td><td>未収載です（初回公開の必須範囲外・空のカテゴリは作りません）</td></tr>
    <tr><td>法務</td><td><code>legal.analyticsProvider</code></td><td>解析事業者</td><td>解析無効のため未設定です</td></tr>
  </tbody>
</table>

## 公開前に人の確認が必要な項目

- [ ] 公開ドメインの所有・DNS・HTTPS・既存URL・Search Console の確認
- [ ] OpenAI API・LINE公式アカウント・LINE経由の電話相談フローを実環境で確認（指定されたテスト範囲のみ）
- [ ] 料金・税区分・支払い・取消/返金・組合加入条件の規約との一致確認
- [ ] 元保育士スタッフの氏名・経歴・担当窓口・本人確認・掲載許可
- [ ] 個人情報の保存先・保存期間・削除方法・外部サービスの学習利用有無
- [ ] 公開用スクリーンショット・操作・200/404・sitemap・canonical の最終確認
- [ ] 本番ホスティングで `_headers` が反映されることの確認
- [ ] 公開操作・DNS変更・広告・実送信を行わないことの最終承認

## 判定ルール

- `null` は未確認、`false` は未承認・未検証または初期無効です。
- 未確認の料金を `0円` として表示しません。
- 3窓口の接続確認・料金・運営情報・公開承認が揃わない限り、`--production` は失敗します。
- 公開用HTMLに `確認中`、`プレビュー`、`TODO`、`TBD`、テストURL・テスト電話番号が残る場合は失敗します。
- 自動チェックは、実接続・法務確認・本人同意・DNS・Search Console・広告設定の承認を代替しません。

## 設定の入力順（推奨）

1. `operator`（正式名称・所在地・責任者・問い合わせ先）
2. `channels`（AIはサーバー側API、LINE ID/URL、電話相談のLINE経由フロー、料金・受付時間・担当体制・`verified`）
3. `pricing.items` と `pricing.total`（金額・税区分・支払い・総額の注記）
4. `service.scope`・`service.membershipConditions`・`service.cancellationRefundPolicy`
5. `staff`（公開承認済みプロフィール）
6. `legal`（施行日・保存期間・削除方法・外部事業者）
7. `publication`（4つの承認フラグ）
8. `canonicalOrigin`・`contentUpdatedAt`

詳細は `README.md` と `docs/LAUNCH-CHECKLIST.md` を参照してください。
