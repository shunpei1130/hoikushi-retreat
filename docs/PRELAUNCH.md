# 公開ブロッカー・未確認項目

> このファイルは `scripts/build.mjs` により自動生成されています。手動編集はビルドで上書きされます。
>
> - モード: **preview**
> - 生成: 2026-11-04 04:15:34 UTC
> - 設定ファイル: `site.config.json`
> - 公開ドメイン: 未設定
> - 公開ブロッカー: **12件**（未設定 12 / 不整合 0）
> - 警告: **3件**

## 公開ブロッカー

<table>
  <thead><tr><th>区分</th><th>設定キー</th><th>項目</th><th>状態</th></tr></thead>
  <tbody>
    <tr><td>公開設定</td><td><code>canonicalOrigin</code></td><td>公開ドメイン（https）</td><td>未設定</td></tr>
    <tr><td>運営者</td><td><code>operator.address</code></td><td>所在地</td><td>未設定</td></tr>
    <tr><td>AIチャット</td><td><code>channels.ai.verified</code></td><td>AIチャット接続の確認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>LINE相談</td><td><code>channels.line.verified</code></td><td>LINE公式アカウントの確認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>電話相談</td><td><code>channels.phone.verified</code></td><td>LINE経由の電話相談フロー確認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>サービス</td><td><code>service.contactPolicyApproved</code></td><td>勤務先への連絡方針の承認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>対応範囲</td><td><code>service.scope.verified</code></td><td>対応範囲の承認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>公開承認</td><td><code>publication.businessApproved</code></td><td>事業面の公開承認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>公開承認</td><td><code>publication.privacyApproved</code></td><td>個人情報面の公開承認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>公開承認</td><td><code>publication.contentApproved</code></td><td>コンテンツの公開承認</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>公開承認</td><td><code>publication.technicalVerified</code></td><td>技術検証の完了</td><td>承認・確認が true ではありません</td></tr>
    <tr><td>相談員</td><td><code>staff</code></td><td>元保育士スタッフのプロフィール</td><td>公開承認済みのプロフィールがありません</td></tr>
  </tbody>
</table>

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
