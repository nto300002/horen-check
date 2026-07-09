# 保存期間・退会運用手順 MVP

## 退会処理

1. 管理者が退会対象ユーザーを確認する。
2. `deactivateUser` を実行し、`users.active=false` に更新する。
3. Firebase Auth の対象ユーザーを `disabled=true` に更新する。
4. `auditLogs` に退会理由と実行者を記録する。
5. 退会後のユーザーは日次 `notificationEvents` / `reportEvents` 生成対象から除外する。

## 保存期間候補抽出

`functions/src/usecase/retentionPolicy.ts` の `selectRetentionCandidates` を使い、以下の候補を抽出する。

- 30日超過の `notificationEvents`
- 30日超過の `notificationLogs`
- 180日超過の `reports`
- 180日超過の `reportDeliveries`
- 180日超過の退会済み `users`

## 削除・匿名化方針

- `notificationEvents` と `notificationLogs` は削除対象とする。
- `reports` は本文、自由入力、相談内容などを匿名化対象とする。
- `reportDeliveries` は宛先メールアドレスなどの送信先情報を匿名化対象とする。
- 退会済み `users` は氏名とメールアドレスを匿名化対象とする。
- `auditLogs` は説明責任と不正防止のため保存する。

## 注意事項

MVPでは削除・匿名化の実行を自動化せず、候補抽出ロジックと運用手順を固定する。実行ジョブ化する場合は、本手順をもとに dry-run、件数確認、明示的な execute フラグを必須にする。
