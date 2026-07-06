# ホウレンチェック 詳細定義書

統合版 v1.0  
作成元: `ホウレンチェック 要件定義・詳細設計メモ.pdf`

## 1. 文書目的

本書は、ホウレンチェックの要件定義・詳細設計メモを、実装着手時に参照しやすい詳細定義書として再構成したものである。

対象範囲は、通知モード、報告支援モード、モード切り替え、ロール・権限、ユーザー管理、担当者紐づけ、通知、報告、相談、一般就労移行、データ保存、法務・プライバシー、データモデル、API、Security Rules、TDD方針、MVP公開条件である。

## 2. プロダクト定義

### 2.1 プロダクト名

ホウレンチェック

### 2.2 一文定義

ホウレンチェックは、報連相忘れを防ぐための就労支援・業務報告支援アプリである。

### 2.3 中核価値

- 報告タイミングを通知する
- 報告文作成の負担を軽減する
- 訓練期間中の報連相を支援する
- 就労支援系サービスから一般就労へ移行する際のコミュニケーションを支援する
- 一般就労後の定着支援を行う

通知モードでは、ある程度自己管理できる人が、自分だけで報告タイミングを管理できるようにする。

報告支援モードでは、本人、上司、支援員、管理者が関わりながら、報告忘れ防止、相談、未報告確認、一般就労移行、定着支援を行う。

## 3. 解決する課題

### 3.1 主課題

リモート勤務や就労支援の場面で、業務開始、業務終了、進捗、相談などの定型報告を忘れてしまうことを防ぐ。

### 3.2 背景課題

- 報告タイミングを忘れる
- 報告文を考える負担がある
- 報告先が状況によって変わる
- 支援員中心から上司中心へ移行する過程で報連相が崩れやすい
- 未報告状態を本人支援に使いたいが、監視ツール化は避けたい
- ADHD傾向や報連相が苦手な人にとって、外部化された報告支援が必要

### 3.3 非目的

本アプリは、以下を目的としない。

- 勤怠管理
- 給与管理
- 人事評価
- 医療情報管理
- 障害情報管理
- 診断支援
- 精神状態の記録
- 体調管理
- 監視ツール化

## 4. モード定義

| モード | `accountMode` | 概要 |
| --- | --- | --- |
| 通知モード | `notification_mode` | 本人だけで使える軽量な通知中心モード |
| 報告支援モード | `report_support_mode` | 上司・支援員・管理者が関与する本格支援モード |

### 4.1 通知モード

通知モードは、ある程度自己管理できる人向けのモードである。

特徴:

- 本人だけで使える
- 管理者、上司、支援員の紐づけは不要
- 本人がフォームから新規登録できる
- AM開始、AM終了、PM開始、PM終了を初期テンプレートとして持つ
- `CUSTOM`通知を自由追加できる
- 報告済みチェックはMVPでは持たない
- 報告本文、送信先、`reportDeliveries`、`assignments`、`auditLogs`は原則使わない

MVP対象外:

- 報告済みチェック
- `reportEvents`
- `reports`
- `reportDeliveries`
- `selectedRecipients`
- `excludedRecipients`
- `assignments`
- manager / supporter 紐づけ
- `auditLogs`必須化
- `employmentContext`
- 一般就労移行

将来追加候補:

- 報告済みチェック
- 自分用メモ
- 報告文テンプレート
- 自己振り返り履歴
- Googleログイン
- 通知モードから報告支援モードへの移行履歴

### 4.2 報告支援モード

報告支援モードは、本人、上司、支援員、管理者が関わりながら、報告忘れ防止、報連相支援、一般就労移行、就労定着支援を行うモードである。

特徴:

- worker / manager / supporter / admin を使う
- `assignments` が必要
- `workerSettings` を使う
- `reportSchedules` / `reportEvents` / `reports` / `reportDeliveries` を使う
- `selectedRecipients` / `excludedRecipients` を使う
- `auditLogs` を使う
- `employmentContext` を使う
- 一般就労移行・定着支援に対応する

## 5. モード切り替え

### 5.1 基本方針

通知モードから報告支援モードへの切り替えのみ可能とする。

- `notification_mode` -> `report_support_mode` は可能
- `report_support_mode` -> `notification_mode` は不可

報告支援モードでは、上司、支援員、管理者、報告履歴、送信先、監査ログが絡むため、通知モードへ戻すとデータ整合性と権限管理が複雑になる。

### 5.2 承認者

本人が切り替えを申請し、支援員または管理者が承認する。

### 5.3 申請方法

- 支援員または管理者からの招待リンク方式
- 本人による支援員メールアドレス入力方式

通常UIでは、支援員メールアドレス入力方式を表示する。招待リンク方式はURLから直接処理する。

### 5.4 切り替え先の必須担当者

| `employmentContext` | 必須 | 任意 |
| --- | --- | --- |
| `general_employment` | `managerId` | `supporterId` |
| `supported_facility` | `supporterId` | `managerId` |

## 6. 対応環境・技術方針

### 6.1 MVP対象

- Flutter Web
- PWA
- Web Push通知
- メール通知
- アプリ内通知

### 6.2 将来対応

- Androidアプリ
- iOSアプリ
- Slack連携
- Chatwork連携
- Google Chat連携
- Microsoft Teams連携

### 6.3 MVP対象外

- Androidネイティブアプリ
- iOSアプリ
- Chrome拡張
- Slack連携
- Chatwork連携
- 勤怠管理
- 給与・評価連携
- 高度なAI文章生成
- タスク細分化
- CSV出力
- 統計ダッシュボード

### 6.4 フロントエンド

- Flutter Web
- PWA
- Riverpod

### 6.5 バックエンド

- Firebase Authentication
- Firestore
- Cloud Functions
- Firebase Cloud Messaging
- Firebase Hosting

### 6.6 Cloud Functions

- TypeScript
- Jest
- `domain` / `usecase` / `repository` / `functions` に分割する

### 6.7 メール送信

Amazon SESを採用する。

用途:

- 通知モードのメールフォールバック
- 報告支援モードの報告メール送信
- `retryReportDelivery`による再送
- モード切り替え承認・却下通知
- 必要に応じた重要通知

### 6.8 テスト環境

- Firebase Emulator Suite
- Flutter local test
- CI
- Jest
- Security Rules Test
- Functions Emulator Test

## 7. ロール定義

| 表示名 | DB/API上の`role` | 説明 |
| --- | --- | --- |
| 本人 / 一般ユーザー | `worker` | 報告または通知を受ける利用者 |
| 上司 | `manager` | workerの報告を確認する |
| 支援員 | `supporter` | workerの就労支援・設定支援を行う |
| 管理者 | `admin` | 全ユーザー・全設定を管理する |

通知モード利用者も`role`は`worker`とする。`accountMode`で通知モードか報告支援モードかを判定する。

## 8. 管理者・運営者

### 8.1 管理者

管理者は、全ユーザー、全ロール、担当者紐づけ、スケジュール、報告履歴、監査ログを確認・管理できる。

管理者は全権限を持つが、ロール変更、担当者紐づけ、スケジュール変更、報告本文閲覧などの重要操作は監査ログとして保存する。

MVPでは単一組織前提とする。

### 8.2 運営者

ホウレンチェックは個人名で運営する。プライバシーポリシー、利用規約、問い合わせ窓口には、運営者として個人名を記載する。

独自ドメインメールと問い合わせフォームを併用する。

## 9. 権限定義

| 操作 | worker | manager | supporter | admin |
| --- | --- | --- | --- | --- |
| 当日の在宅/出社変更 | 申請のみ | できる | できる | できる |
| 基本スケジュール設定 | 申請のみ | できる | できる | できる |
| 基本スケジュール変更申請 | できる | 不要 | 不要 | 不要 |
| 当日の休み設定 | 申請のみ | 承認できる | 承認できる | できる |
| 通知のスヌーズ | できる | できない | できない | できる |
| 通知音OFF | できる | できない | できない | できる |
| 通知完全停止 | できない | できる | できる | できる |
| 報告テンプレート設定 | できる | できる | できる | できる |
| 担当者紐づけ | できない | できない | 申請のみ | できる |
| ユーザー作成 | できない | できない | 申請のみ | できる |
| ロール変更 | できない | できない | できない | できる |
| 全ユーザー閲覧 | できない | できない | できない | できる |
| 担当利用者閲覧 | 自分のみ | 担当workerのみ | 担当workerのみ | 全員 |
| 当日未報告状態閲覧 | 自分のみ | 担当workerのみ | 担当workerのみ | 全員 |
| 過去未報告ログ閲覧 | 自分のみ | 原則不可 | 担当workerのみ | 全員 |
| 報告作成 | できる | 代理作成は原則不可 | できない | できない |
| 相談報告への返信 | できる | 条件付きでできる | 条件付きでできる | 条件付きでできる |
| メール再送 | できる | できない | 必要ならできる | できる |

## 10. ユーザー管理

### 10.1 通知モード新規登録

MVPではメールアドレス + パスワード登録のみとし、Googleログインは将来対応とする。

登録フロー:

1. 利用者が新規登録フォームを開く
2. メールアドレス + パスワードでFirebase Authに登録する
3. `createNotificationUserProfile` APIを実行する
4. `users`ドキュメントを作成する
5. `users.accountMode = notification_mode` にする
6. `users.role = worker` にする
7. `notificationSettings`を作成する
8. 初期4種`notificationSchedules`を作成する
9. 必要に応じて通知許可を求める

### 10.2 報告支援モード招待

- 管理者がメールアドレスを入力してユーザーを招待する
- 招待トークンの有効期限は7日とする
- 同じメールアドレスに対して`pending`状態の招待がある場合、既存招待を再送する

### 10.3 支援員によるユーザー作成申請

- 支援員はworkerユーザーの作成申請を行える
- 支援員が直接ユーザーを作成することはできない
- 管理者が承認した場合のみ招待メールを送信する

### 10.4 ユーザー停止

ユーザー停止時は、`users.active=false`にし、Firebase Authも無効化する。物理削除は行わない。

## 11. 担当者紐づけ

- MVPでは、workerにmanager 1人、supporter 1人を紐づける
- 将来はmanager複数、supporter複数に対応できる余地を残す
- 担当者紐づけを直接変更できるのは管理者のみとする
- 支援員は担当者紐づけ変更を申請できる
- 担当解除時は`assignments.active=false`にし、物理削除しない
- 担当者紐づけ、変更、解除は`auditLogs`に記録する
- 担当者紐づけ時、変更時、解除時は関係者全員に通知する

## 12. 報告タイミング

MVPでは以下の4タイミングで報告を行う。

| type | 内容 |
| --- | --- |
| `AM_START` | 午前業務開始報告 |
| `AM_END` | 午前業務終了報告 |
| `PM_START` | 午後業務開始報告 |
| `PM_END` | 業務終了報告 |

最初の報告支援モード縦切り実装は`AM_START`のみを対象とする。

## 13. `workStyle` と `employmentContext`

### 13.1 用語方針

本アプリでは、「勤務スタイル」と「就労・利用文脈」を分離して扱う。「勤務形態」という曖昧な表現は、設計書、DB、APIでは原則使用しない。

### 13.2 `workStyle`

`workStyle`は、その日の働き方を表す。

| 値 | 表示名 |
| --- | --- |
| `remote` | 在宅 |
| `office` | 出社 |
| `day_off` | 休み |

### 13.3 `employmentContext`

`employmentContext`は、報告先や支援関係を決める文脈を表す。

| 値 | 表示名 |
| --- | --- |
| `supported_facility` | 就労支援施設利用 |
| `general_employment` | 一般就労 |

`employmentContext`で決めるもの:

- 報告メールの初期送信先
- アプリ内通知の初期送信先
- 未報告表示の主対象
- 支援員への通知有無
- 上司への通知有無
- workerの報告画面での送信先初期選択

## 14. `workerSettings`

workerごとの報告先、通知、就労文脈設定を`workerSettings`で管理する。

項目:

- `userId`
- `organizationId`
- `defaultEmploymentContext`
- `allowWorkerSelectRecipients`
- `requiredRecipientPolicy`
- `consultationRequiredRecipientPolicy`
- `transitionRecipientPolicy`
- `notifySupporterInGeneralEmployment`
- `notifyManagerInSupportedFacility`
- `missedVisibilityPolicy`
- `activeTransitionId`
- `soundEnabled`
- `snoozeMinutes`
- `localDraftEnabled`
- `displayPreferences`
- `createdAt`
- `updatedAt`

workerが更新できる項目:

- `soundEnabled`
- `snoozeMinutes`
- `localDraftEnabled`
- `displayPreferences`

manager / supporter / admin が更新できる項目:

- `defaultEmploymentContext`
- `requiredRecipientPolicy`
- `consultationRequiredRecipientPolicy`
- `transitionRecipientPolicy`
- `notifySupporterInGeneralEmployment`
- `notifyManagerInSupportedFacility`
- `missedVisibilityPolicy`

`activeTransitionId`は一般就労移行APIのみが更新できる。

## 15. 通知モードスケジュール

### 15.1 `notificationSchedules`

通知モードでは、`reportSchedules`ではなく`notificationSchedules`を使う。

項目:

- `id`
- `userId`
- `title`
- `type`
- `time`
- `dayOfWeek`
- `enabled`
- `snoozeMinutes`
- `repeatIntervalMinutes`
- `repeatLimitCount`
- `mailFallbackEnabled`
- `deletedAt`
- `createdAt`
- `updatedAt`

### 15.2 `type`

- `AM_START`
- `AM_END`
- `PM_START`
- `PM_END`
- `CUSTOM`

### 15.3 初期4種

登録時に以下を作成する。

- `AM_START`: AM開始報告の時間です
- `AM_END`: AM終了報告の時間です
- `PM_START`: PM開始報告の時間です
- `PM_END`: PM終了報告の時間です

初期4種は削除不可とし、`enabled=false`による無効化のみ可能とする。

編集可能項目:

- 時刻
- 曜日
- 有効/無効

編集不可項目:

- `type`
- タイトル

### 15.4 `CUSTOM`通知

- ユーザーが自由にタイトル、時刻、曜日、スヌーズを設定できる
- 最大10件まで作成できる
- 論理削除可能

## 16. 通知モードイベント

### 16.1 `notificationEvents`

`notificationSchedules`から、毎日0時に当日分の`notificationEvents`を生成する。

項目:

- `id`
- `scheduleId`
- `userId`
- `title`
- `type`
- `dueAt`
- `status`
- `notificationCount`
- `lastNotifiedAt`
- `snoozeUntil`
- `createdAt`
- `updatedAt`

### 16.2 `status`

- `pending`
- `notified`
- `failed`
- `snoozed`
- `cancelled`

### 16.3 再通知

通知モードの再通知は、5分ごとに最大3回とする。最大3回までは`pending`のまま`notificationCount`で管理し、上限到達後に`status=notified`にする。

### 16.4 スヌーズ

スヌーズは`notificationSchedules.snoozeMinutes`を基本値として使い、eventごとに`snoozeUntil`を持つ。

### 16.5 キャンセル

ユーザーは当日通知を手動キャンセルできる。`pending` / `snoozed` のeventのみキャンセル可能とする。

`notified` / `failed` / `cancelled` のeventはキャンセル不可とする。

## 17. 通知モード通知履歴

通知モードでも`notificationLogs`を使う。

項目:

- `id`
- `userId`
- `eventId`
- `accountMode`
- `notificationType`
- `channel`
- `status`
- `errorMessage`
- `sentAt`
- `clickedAt`
- `createdAt`

保存期間は30日とする。

簡易通知履歴画面の表示項目:

- 通知日時
- 通知タイトル
- 通知種別
- 通知ステータス
- 通知チャネル

表示文:

> この履歴は通知の送信履歴です。実際に報告したかどうかを記録するものではありません。

## 18. 報告内容・テンプレート

### 18.1 報告内容

報告では以下を扱う。

- 完了
- 進捗
- 相談
- 自由入力

`reportStatus`:

- `completed`
- `progress`
- `consultation`

`AM_START` / `PM_START`入力項目:

- 今日やること / この時間帯にやること
- 相談事項
- 自由入力

`AM_END` / `PM_END`入力項目:

- 完了したこと
- 残ったこと
- 次にやること
- 相談事項
- 自由入力

### 18.2 文体

報告テンプレートは丁寧文体で統一する。

### 18.3 テンプレート

`AM_START`:

```text
おはようございます。
これから午前の作業を開始します。
本日は〇〇に取り組みます。
```

`AM_END`:

```text
午前の作業を終えました。
完了したこと：〇〇。
残っていること：△△。
次にやること：□□。
```

`PM_START`:

```text
午後の作業を開始します。
これから〇〇に取り組みます。
```

`PM_END`:

```text
本日の作業を終えました。
完了したこと：〇〇。
残っていること：△△。
次回やること：□□。
```

相談事項がある場合、本文末尾に以下を追加する。

```text
相談したいこと：〇〇
```

自由入力がある場合、本文末尾に以下を追加する。

```text
補足：〇〇
```

必須入力:

- `AM_START` / `PM_START`: やることが必須
- `AM_END` / `PM_END`: 完了したことが必須

## 19. 送信先選択

`submitReport`では送信先選択を扱う。

- 送信先の初期選択は自動で決定する
- workerは、`workerSettings`で許可されている範囲内で送信先を追加・除外できる
- 実際に送信した相手は`reports.selectedRecipients`に保存する
- 初期候補に表示されたがworkerが除外した相手は`reports.excludedRecipients`に保存する

`supported_facility`の場合:

- 初期送信先はsupporter
- `workerSettings.notifyManagerInSupportedFacility=true`の場合、managerも初期送信先に含める

`general_employment`の場合:

- 初期送信先はmanager
- `workerSettings.notifySupporterInGeneralEmployment=true`の場合、supporterも初期送信先に含める

移行期間中:

- `activeTransitionId`が存在し、`transition.status=active`の場合、`transitionRecipientPolicy`に従う
- managerとsupporterの両方を初期送信先または必須送信先にできる

## 20. 相談報告

`reportStatus=consultation` の場合、相談スレッドを自動作成する。

- 相談スレッドは`consultationThreads`で管理する
- 返信できるのは、`selectedRecipients`に含まれるmanager / supporterとする
- workerも相談スレッドに返信できる
- workerまたは返信者のどちらも相談スレッドを完了にできる
- 相談返信通知の方法は`workerSettings`で設定する
- MVP初期値は、アプリ内通知 + メールとする

## 21. 訂正版

報告送信後は本文を上書きしない。訂正が必要な場合は`reportCorrections`に訂正版を追記する。

`reportCorrections`項目:

- `id`
- `reportId`
- `workerId`
- `organizationId`
- `previousText`
- `correctedText`
- `reason`
- `submittedAt`
- `createdAt`

## 22. 一般就労移行・定着支援

### 22.1 方針

- 一般就労移行をMVPに含める
- workerは一般就労移行希望を入力できる
- supporterまたはadminがworkerの希望を確認し、正式な移行設定へ変換できる
- manager / supporter / adminは、workerの希望申請なしで移行設定を開始できる
- 移行期間中の送信先は`workerSettings`で必須・任意を設定する
- 移行完了は`transitionEndDate`で自動完了せず、自動完了予定日を出し、manager / supporter / admin が手動確認して完了する
- 移行中に上司が変わる場合は、`oldManagerId` / `newManagerId`を両方保持する
- 移行中に支援員が変わる場合は、`oldSupporterId` / `newSupporterId`を両方保持する

### 22.2 `employmentContextTransitions`

項目:

- `id`
- `workerId`
- `organizationId`
- `fromContext`
- `toContext`
- `status`
- `transitionStartDate`
- `transitionEndDate`
- `keepSupporterNotified`
- `keepManagerNotified`
- `transitionRecipientPolicy`
- `oldManagerId`
- `newManagerId`
- `oldSupporterId`
- `newSupporterId`
- `createdBy`
- `approvedBy`
- `reason`
- `completedBy`
- `completedAt`
- `completionReason`
- `cancelledBy`
- `cancelledAt`
- `cancellationReason`
- `createdAt`
- `updatedAt`

`status`:

- `planned`
- `active`
- `completed`
- `cancelled`

## 23. モード切り替えDB・画面

### 23.1 `modeSwitchRequests`

項目:

- `id`
- `userId`
- `fromMode`
- `toMode`
- `requestMethod`
- `organizationId`
- `requestedBy`
- `requestedSupporterEmail`
- `requestedSupporterId`
- `inviteTokenId`
- `desiredEmploymentContext`
- `message`
- `inheritNotificationSchedules`
- `scheduleMigrationPolicy`
- `managerId`
- `supporterId`
- `status`
- `reviewedBy`
- `reviewedAt`
- `reviewComment`
- `createdAt`
- `updatedAt`

`status`:

- `pending`
- `approved`
- `rejected`
- `cancelled`

`requestMethod`:

- `invite_link`
- `supporter_email`

`scheduleMigrationPolicy`:

- `none`
- `convert_am_pm`
- `keep_personal_notifications`
- `convert_am_pm_and_keep_custom`

MVPでは`none`と`convert_am_pm`を優先実装する。

### 23.2 worker側画面

切り替え申請画面への入り口:

- 通知モードホーム
- 設定画面

入力項目:

- 支援員メールアドレス
- 希望`employmentContext`
- メッセージ

申請後:

- 申請中画面へ遷移する
- 通知モードホームにも申請中ステータスを表示する
- pending申請中は再申請不可
- 取り消し後なら再申請可能
- 却下時は却下理由と再申請導線を表示する
- 承認後は次回ログイン時に報告支援モードホームへ遷移する

### 23.3 supporter/admin側画面

申請一覧画面に表示する項目:

- 申請者名
- 申請者メールアドレス
- 希望`employmentContext`
- メッセージ
- 申請日時
- `status`

承認画面に表示する項目:

- 申請者情報
- 希望`employmentContext`
- メッセージ
- manager紐づけ
- supporter紐づけ
- スケジュール引き継ぎ選択

MVPのスケジュール引き継ぎUI:

- `none`
- `convert_am_pm`

## 24. 通知

### 24.1 通知方式

MVPでは以下を通知方式とする。

- Web Push通知
- メール通知
- アプリ内通知

通知は、軽い通知音と画面上のOS通知を想定する。

### 24.2 通知本文

Push通知には、氏名、報告本文、相談内容、業務詳細、所属組織名を表示しない。通知文は最小限にする。

例:

- AM開始報告の時間です
- 未報告の報告があります
- 通知の時間です

### 24.3 通知許可拒否時

Web Push通知が許可されていない場合、メール通知とアプリ内警告で代替する。

### 24.4 通知モードのメールフォールバック

通知モードでは、通常はWeb Push通知を使う。Web Pushが拒否されている場合、またはFCM tokenが存在しない場合、またはPush送信に失敗した場合、メール通知へフォールバックする。

MVPでは登録メールアドレスへ送る。将来、fallback用メール設定を追加する。

## 25. 保存期間

| データ | 保存期間 |
| --- | --- |
| アカウント情報 | 退会または利用停止後90日 |
| 通知モードの通知履歴 | 30日 |
| 通知モードの`notificationEvents` | 30日 |
| 通知モードの`notificationSchedules` | 利用中。削除時は論理削除 |
| 報告本文 | 90日 |
| 未報告ログ | 90日 |
| 相談返信 | 90日 |
| 通知履歴 | 90日 |
| `reportDeliveries` | 90日 |
| `auditLogs` | 180日 |
| `functionsLogs` | 30日 |
| 招待ログ | 90日 |

## 26. 法律・プライバシー方針

### 26.1 基本方針

ホウレンチェックは、本人の通知支援、報告支援、上司への業務報告共有、支援員による就労支援、通知・履歴管理、監査ログ管理を目的として個人情報を取り扱う。

取得した報告内容、未報告状態、スケジュール、操作ログは、MVPでは勤怠評価・人事評価を目的として利用しない。

本アプリは、報告忘れ防止および就労支援を目的とし、MVPでは勤怠管理、人事評価、医療情報管理、障害情報管理を目的としない。

### 26.2 取得する情報

共通:

- 氏名
- メールアドレス
- ログイン情報
- アカウント種別
- 通知設定
- FCM token
- IPアドレス
- userAgent
- 問い合わせ内容

通知モード:

- 通知スケジュール
- 通知イベント
- 通知履歴
- スヌーズ設定
- 通知キャンセル履歴
- モード切り替え申請内容

報告支援モード:

- 所属組織
- ロール
- 担当者紐づけ
- 勤務スタイル
- 就労・利用文脈
- 報告スケジュール
- 報告イベント
- 報告本文
- 相談内容
- 報告送信先
- 報告送信履歴
- 未報告状態
- 相談返信
- 一般就労移行・定着支援に関する設定
- 監査ログ

### 26.3 取得しない情報

MVPでは以下を保存しない。

- ADHD診断の有無
- 障害名
- 障害者手帳の有無
- 服薬情報
- 体調
- 集中度
- メンタル状態
- 病歴
- 医療情報

アプリ説明では「報連相忘れを防ぐ就労支援アプリ」と表現する。ADHD向けであることは補足に留める。

### 26.4 報告本文入力時の注意文

報告本文および相談本文には、健康情報、障害情報、家庭事情などのセンシティブ情報を入力しないよう、入力画面で注意文を表示する。

表示文例:

> 業務報告に必要な内容を入力してください。体調・診断名・家庭事情など、業務報告に不要な個人情報は入力しないでください。

### 26.5 問い合わせ窓口

問い合わせ先は、独自ドメインメール + 問い合わせフォームを併用する。

受け付ける問い合わせ:

- 不具合報告
- アカウント削除依頼
- 個人情報の開示依頼
- 個人情報の訂正依頼
- 個人情報の削除依頼
- 通知停止に関する問い合わせ
- メール停止に関する問い合わせ
- データ取扱いに関する相談

### 26.6 データ削除・退会

削除依頼は、原則としてログイン後のアプリ内申請から受け付ける。問い合わせメールから依頼された場合は、登録メールアドレスへの返信確認を行う。

削除対象:

- アカウント情報
- 通知モードデータ
- 報告支援モードの本人データ

ただし、監査ログ、法令対応に必要な最低限のログ、不正利用防止に必要な最低限のログ、問い合わせ対応に必要な最低限の記録は保存期間まで保持する場合がある。

退会時処理:

1. `users.active=false` にする
2. Firebase Authを無効化する
3. 通知送信対象から除外する
4. 新規`reportEvents` / `notificationEvents`を生成しない
5. 保存期間経過後に削除または匿名化する

### 26.7 利用規約に入れる内容

- 本サービスの目的
- 利用登録
- アカウント管理
- 禁止事項
- 報告内容の責任
- 通知・メールの不達に関する免責
- 外部サービス利用
- サービス変更・停止
- データ保存期間
- アカウント停止・削除
- 免責事項
- 問い合わせ先

通知・メール不達の免責:

> 本サービスは、通知およびメールの確実な到達を保証するものではありません。利用者は、OS、ブラウザ、メールサービス等の設定により通知やメールを受信できない場合があることを了承するものとします。

報告内容の責任:

> 利用者は、報告本文および相談内容に、業務報告に必要な内容を入力するものとします。体調、診断名、家庭事情など、業務報告に不要な個人情報やセンシティブな情報の入力は避けてください。

勤怠・人事評価に使わない旨:

> 本サービスは、報告忘れ防止および就労支援を目的とするものであり、MVPでは勤怠管理、人事評価、給与管理を目的として利用しません。

### 26.8 外部サービス

MVPで記載する外部サービス:

- Firebase / Google Cloud
- Amazon SES

将来追加時に更新する候補:

- Slack
- Chatwork
- Google Chat
- Microsoft Teams

MVPで実際に利用する外部サービスだけを記載し、将来追加時にプライバシーポリシーを更新する。

### 26.9 プライバシーポリシー改定通知

軽微な変更はアプリ内通知で知らせる。本質的変更はメール通知も行う。

軽微な変更の例:

- 表現修正
- 誤字修正
- 問い合わせ先の補足

本質的変更の例:

- 利用目的の追加
- 取得情報の追加
- 外部委託先の追加
- 外部連携先の追加
- 共有先の変更
- 保存期間の変更

## 27. データモデル

### 27.1 `users`

- `id`
- `name`
- `email`
- `role`
- `accountMode`
- `organizationId`
- `active`
- `createdAt`
- `updatedAt`

### 27.2 `organizations`

- `id`
- `name`
- `createdAt`
- `updatedAt`

### 27.3 `assignments`

- `id`
- `workerId`
- `managerId`
- `supporterId`
- `organizationId`
- `active`
- `createdBy`
- `updatedBy`
- `deactivatedBy`
- `deactivatedAt`
- `createdAt`
- `updatedAt`

### 27.4 `notificationSettings`

- `userId`
- `pushEnabled`
- `mailEnabled`
- `soundEnabled`
- `fallbackEmail`
- `createdAt`
- `updatedAt`

### 27.5 `notificationSchedules`

- `id`
- `userId`
- `title`
- `type`
- `time`
- `dayOfWeek`
- `enabled`
- `snoozeMinutes`
- `repeatIntervalMinutes`
- `repeatLimitCount`
- `mailFallbackEnabled`
- `deletedAt`
- `createdAt`
- `updatedAt`

### 27.6 `notificationEvents`

- `id`
- `scheduleId`
- `userId`
- `title`
- `type`
- `dueAt`
- `status`
- `notificationCount`
- `lastNotifiedAt`
- `snoozeUntil`
- `createdAt`
- `updatedAt`

### 27.7 `workerSettings`

- `userId`
- `organizationId`
- `defaultEmploymentContext`
- `allowWorkerSelectRecipients`
- `requiredRecipientPolicy`
- `consultationRequiredRecipientPolicy`
- `transitionRecipientPolicy`
- `notifySupporterInGeneralEmployment`
- `notifyManagerInSupportedFacility`
- `missedVisibilityPolicy`
- `activeTransitionId`
- `soundEnabled`
- `snoozeMinutes`
- `localDraftEnabled`
- `displayPreferences`
- `createdAt`
- `updatedAt`

### 27.8 `reportSchedules`

- `id`
- `workerId`
- `organizationId`
- `type`
- `workStyle`
- `dayOfWeek`
- `time`
- `enabled`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

### 27.9 `reportEvents`

- `id`
- `scheduleId`
- `workerId`
- `organizationId`
- `type`
- `dueAt`
- `status`
- `workStyle`
- `employmentContext`
- `notificationCount`
- `lastNotifiedAt`
- `visibleToManagerAfter`
- `createdAt`
- `updatedAt`

### 27.10 `reports`

- `id`
- `eventId`
- `workerId`
- `organizationId`
- `type`
- `reportStatus`
- `employmentContext`
- `generatedText`
- `editedText`
- `selectedRecipients`
- `excludedRecipients`
- `submittedAt`
- `createdAt`
- `updatedAt`

### 27.11 `reportDeliveries`

- `id`
- `reportId`
- `workerId`
- `recipientUserId`
- `channel`
- `destination`
- `status`
- `errorMessage`
- `sentAt`
- `retryCount`
- `createdAt`
- `updatedAt`

### 27.12 `notificationLogs`

- `id`
- `userId`
- `eventId`
- `accountMode`
- `notificationType`
- `channel`
- `status`
- `errorMessage`
- `sentAt`
- `clickedAt`
- `createdAt`

### 27.13 `consultationThreads`

- `id`
- `reportId`
- `workerId`
- `organizationId`
- `status`
- `createdAt`
- `updatedAt`
- `closedBy`
- `closedAt`

### 27.14 `reportReplies`

- `id`
- `threadId`
- `reportId`
- `senderId`
- `senderRole`
- `body`
- `createdAt`

### 27.15 `auditLogs`

- `id`
- `organizationId`
- `actorId`
- `actorRole`
- `action`
- `targetType`
- `targetId`
- `targetUserId`
- `beforeValue`
- `afterValue`
- `reason`
- `ipAddress`
- `userAgent`
- `createdAt`

### 27.16 `modeSwitchRequests`

- `id`
- `userId`
- `fromMode`
- `toMode`
- `requestMethod`
- `organizationId`
- `requestedBy`
- `requestedSupporterEmail`
- `requestedSupporterId`
- `inviteTokenId`
- `desiredEmploymentContext`
- `message`
- `inheritNotificationSchedules`
- `scheduleMigrationPolicy`
- `managerId`
- `supporterId`
- `status`
- `reviewedBy`
- `reviewedAt`
- `reviewComment`
- `createdAt`
- `updatedAt`

### 27.17 `idempotencyKeys`

- `id`
- `organizationId`
- `userId`
- `apiName`
- `key`
- `requestHash`
- `response`
- `status`
- `createdAt`
- `expiresAt`

## 28. API一覧

### 28.1 Phase 1: 通知モード

- `createNotificationUserProfile`
- `createNotificationSchedule`
- `updateNotificationSchedule`
- `deleteNotificationSchedule`
- `generateDailyNotificationEvents`
- `sendDueNotificationReminders`
- `snoozeNotificationEvent`
- `cancelNotificationEvent`
- `listNotificationLogs`
- `registerFcmToken`
- `unregisterFcmToken`
- `updateNotificationSettings`

### 28.2 Phase 2: 報告支援モード AM_START

- `inviteUser`
- `acceptInvitation`
- `updateUserRole`
- `assignUser`
- `updateReportSchedule`
- `resolveRecipients`
- `validateRequiredRecipients`
- `generateDailyReportEvents`
- `sendDueReportReminders`
- `submitReport`
- `retryReportDelivery`
- `listManagerTodayReports`
- `listSupporterWorkers`
- `listAdminUsers`
- `listAuditLogs`

### 28.3 Phase 3: モード切り替え

- `createModeSwitchRequest`
- `reviewModeSwitchRequest`

### 28.4 Phase 4: AM/PM 4報告

- AM_END対応
- PM_START対応
- PM_END対応
- 4報告テンプレート
- 4報告通知
- 4報告`reportEvents`生成
- 4報告`submitReport`対応

### 28.5 Phase 5: 一般就労移行・定着支援

- `createEmploymentTransitionRequest`
- `convertEmploymentTransitionRequest`
- `startEmploymentContextTransition`
- `completeEmploymentContextTransition`
- `cancelEmploymentContextTransition`
- `remindTransitionCompletion`

### 28.6 Phase 6: 相談返信・履歴・管理画面強化

- `createReportReply`
- `closeConsultationThread`
- `confirmReportReply`
- `listManagerConsultationThreads`
- `listSupporterWorkerReports`
- `getManagerReportDetail`
- `getSupporterWorkerReport`
- `getReportForAdmin`
- `createReportCorrection`
- `listReportCorrections`
- `createUserCreationRequest`
- `reviewUserCreationRequest`

## 29. Security Rules 方針

### 29.1 通知モード

直接読み取り許可:

- `users`: 自分の`users`ドキュメント
- `notificationSchedules`: 自分の`notificationSchedules`
- `notificationEvents`: 自分の`notificationEvents`
- `notificationSettings`: 自分の`notificationSettings`

直接書き込み禁止:

- `users.accountMode`
- `notificationSchedules`
- `notificationEvents`
- `notificationLogs`

`notificationLogs`は`listNotificationLogs` API経由で取得する。

### 29.2 報告支援モード

直接読み取り許可:

- worker: 自分の`reportEvents` / `reports` / `workerSettings` / `assignments`
- manager: 担当workerの`reportEvents` / `workerSettings` / `assignments`
- supporter: 担当workerの`reportEvents` / `workerSettings` / `assignments`
- admin: `users` / `assignments` / `workerSettings` / `reportEvents` / `reportDeliveries` / `auditLogs`

`reports`本文:

- workerは自分の`reports`を直接読める
- manager / supporter / admin は`reports`を直接読めない
- manager / supporter / admin の本文閲覧はAPI経由

直接書き込み禁止:

- `reports`
- `reportEvents.status`
- `reportDeliveries`
- `assignments`
- `auditLogs`
- `users.role`
- `workerSettings`の運用設定項目

## 30. 冪等性・二重実行対策

### 30.1 `idempotencyKey`

重要なcreate系APIでは`idempotencyKey`を使う。

対象例:

- `createNotificationUserProfile`
- `createNotificationSchedule`
- `createModeSwitchRequest`
- `reviewModeSwitchRequest`
- `submitReport`
- `inviteUser`
- `assignUser`
- `updateReportSchedule`
- `createChangeRequest`
- `createEmploymentTransitionRequest`
- `createReportCorrection`
- `reviewChangeRequest`
- `reviewUserCreationRequest`
- `startEmploymentContextTransition`

### 30.2 二重送信・重複防止

`submitReport`二重送信対策:

1. `idempotencyKey`
2. `reportEvents.status`
3. `eventId`に紐づく既存`report`

`notificationEvents`重複防止:

1. deterministic ID
2. `dailyGenerationLogs`

`reportEvents`重複防止:

1. `workerId + type + dueAt` の一意チェック
2. `dailyGenerationLogs`

通知多重送信防止:

1. `lastNotifiedAt`
2. `notificationCount`
3. `notificationLocks`

## 31. Error Code方針

API共通エラーは `HttpsError + 独自errorCode` を使う。権限エラー時のメッセージは最小限にする。

代表的`errorCode`:

- `PERMISSION_DENIED`
- `REPORT_ALREADY_SUBMITTED`
- `REPORT_DUPLICATE_DETECTED`
- `INVALID_RECIPIENTS`
- `REQUIRED_RECIPIENT_MISSING`
- `MAIL_DELIVERY_FAILED`
- `REPORT_DETAIL_NOT_ALLOWED`
- `REPORT_DETAIL_EXPIRED`
- `REASON_REQUIRED`
- `CUSTOM_NOTIFICATION_LIMIT_REACHED`
- `INVALID_TIME_FORMAT`
- `INVALID_DAY_OF_WEEK`
- `INITIAL_NOTIFICATION_DELETE_NOT_ALLOWED`
- `NOTIFICATION_EVENT_NOT_FOUND`
- `NOTIFICATION_EVENT_ALREADY_FINALIZED`
- `MODE_SWITCH_REQUEST_NOT_FOUND`
- `MODE_SWITCH_REQUEST_ALREADY_EXISTS`
- `MODE_SWITCH_REQUEST_ALREADY_REVIEWED`
- `MODE_SWITCH_REQUEST_NOT_PENDING`
- `INVALID_MODE_SWITCH_METHOD`
- `MANAGER_REQUIRED_FOR_GENERAL_EMPLOYMENT`
- `SUPPORTER_REQUIRED_FOR_SUPPORTED_FACILITY`
- `MODE_SWITCH_NOT_ALLOWED`

## 32. Phase分類

| Phase | 内容 |
| --- | --- |
| Phase 0 | テスト基盤 |
| Phase 1 | 通知モード最小実装 |
| Phase 2 | 報告支援モード AM_START縦切り |
| Phase 3 | 通知モード -> 報告支援モード切り替え |
| Phase 4 | AM/PM 4報告対応 |
| Phase 5 | 一般就労移行・定着支援 |
| Phase 6 | 相談返信・履歴・管理画面強化 |
| Phase 7 | MVP後・外部連携 |

Phase 0:

- Firebase Emulator Suite
- TypeScript + Jest
- Flutter + Riverpod
- CI
- Factory関数
- seed JSON
- mock mailer
- mock pushSender
- Security Rules Test
- Functions Emulator Test

Phase 1:

- 通知モード新規登録
- 初期4種通知
- CUSTOM通知
- `notificationEvents`生成
- 通知実行
- スヌーズ
- キャンセル
- 簡易通知履歴

Phase 2:

- admin招待
- 担当者紐づけ
- AM_START schedule
- AM_START `reportEvent`生成
- AM_START通知
- `submitReport`
- manager/supporter一覧反映

Phase 3:

- `createModeSwitchRequest`
- `reviewModeSwitchRequest`
- `accountMode`変更
- `workerSettings`作成
- `assignments`作成
- `notificationSchedules` -> `reportSchedules`変換

Phase 4:

- AM_END
- PM_START
- PM_END
- 4報告テンプレート
- 4報告通知
- 4報告`submitReport`

Phase 5:

- `employmentContextTransitions`
- `employmentTransitionRequests`
- `activeTransitionId`
- `transitionRecipientPolicy`
- old/new manager
- old/new supporter

Phase 6:

- `createReportReply`
- `closeConsultationThread`
- report detail APIs
- `reportCorrections`
- user creation requests

Phase 7:

- Slack連携
- Chatwork連携
- Google Chat連携
- Teams連携
- Androidアプリ
- iOSアプリ
- CSV出力
- 統計ダッシュボード

## 33. MVP最小リリース条件

MVPの最小リリース条件は、通知モード + AM_START + モード切り替え + AM/PM 4報告である。

具体的な条件:

1. 通知モードで本人が自分で登録できる
2. 通知モードでAM/PM通知とCUSTOM通知を使える
3. 報告支援モードでAM_START報告が使える
4. 通知モードから報告支援モードへ切り替えられる
5. 報告支援モードでAM_START / AM_END / PM_START / PM_END が使える

## 34. 手動E2E方針

- 手動E2EはPhaseごとに分ける
- 通知モード、報告支援モード、モード切替でも分ける
- 実メール確認はリリース前のみ行う
- 複数ロールログインは、複数ブラウザまたはシークレットウィンドウで確認する

MVPリリース判定:

- 自動テスト
- 手動E2E
- プライバシーポリシー確認

## 35. 受け入れ条件

### 35.1 Phase 1 通知モード

新規登録:

- メールアドレス + パスワードで登録できる
- `createNotificationUserProfile`が実行される
- `users.accountMode = notification_mode` になる
- `users.role = worker` になる
- `notificationSettings`が作成される
- 初期4種`notificationSchedules`が作成される

初期通知設定:

- AM_START / AM_END / PM_START / PM_END が表示される
- 時刻を編集できる
- 曜日を編集できる
- 有効/無効を切り替えられる
- タイトルは編集できない
- 削除できない

CUSTOM通知:

- CUSTOM通知を作成できる
- 最大10件まで作成できる
- 11件目はエラーになる
- タイトル、時刻、曜日、スヌーズを編集できる
- 論理削除できる

通知実行:

- 毎日0時に`notificationEvents`が生成される
- `dueAt`でPush通知が送られる
- 5分ごと最大3回再通知される
- Push失敗時にメールフォールバックされる
- `notificationLogs`に結果が保存される

簡易通知履歴:

- 自分の通知履歴だけ表示される
- 過去30日分まで表示される
- 通知履歴であり報告済み履歴ではない旨が表示される

### 35.2 Phase 2 AM_START

- adminがworker / manager / supporterを招待できる
- adminがworkerにmanager / supporterを紐づけできる
- manager / supporter / adminがworkerのAM_START時刻を設定できる
- 毎日0時にAM_STARTの`reportEvent`が生成される
- AM_START時刻になるとworkerにWeb Push通知が届く
- 通知本文に氏名、報告本文、業務内容が含まれない
- 通知クリックで `/worker/today/report/:eventId` へ遷移する
- workerが今日やること、相談事項、自由入力を入力できる
- AM_START報告文が生成される
- workerが生成文を編集できる
- `employmentContext`に応じて初期送信先が表示される
- `selectedRecipients` / `excludedRecipients` が保存される
- `submitReport`成功時に`reports`が作成される
- `reportEvents.status=reported`になる
- `reportDeliveries`が作成される
- manager / supporter画面に報告済みが反映される
- `report_submitted`が`auditLogs`に保存される

### 35.3 Phase 3 モード切り替え

- 通知モードホームから切り替え申請へ進める
- 設定画面から切り替え申請へ進める
- 支援員メールアドレスを入力できる
- 希望`employmentContext`を選択できる
- メッセージを入力できる
- 申請後、申請中画面へ遷移する
- 通知モードホームに申請中ステータスが表示される
- pending申請がある場合、再申請できない
- 申請を取り消した場合、再申請できる
- supporter/adminが申請一覧を確認できる
- 承認画面でmanager/supporter紐づけを設定できる
- `general_employment`では`managerId`が必須
- `supported_facility`では`supporterId`が必須
- `scheduleMigrationPolicy`を選択できる
- MVPでは`none` / `convert_am_pm`を選択できる
- 承認後、`accountMode`が`report_support_mode`になる
- 承認後、`workerSettings`が作成される
- 承認後、`assignments`が作成される
- `convert_am_pm`選択時、AM/PM通知が`reportSchedules`へ変換される
- `none`選択時、`notificationSchedules`は`reportSchedules`へ変換されない
- 却下時、`reviewComment`がworkerに表示される
- 承認完了後、次回ログイン時に報告支援モードホームへ遷移する

### 35.4 Phase 4 4報告

- AM_START / AM_END / PM_START / PM_END の`reportSchedules`を設定できる
- 毎日0時に4報告分の`reportEvents`が生成される
- 各typeごとの通知文が送信される
- 各typeごとの入力項目が表示される
- 各typeごとのテンプレート文が生成される
- workerが生成文を編集できる
- 相談事項がある場合、「相談したいこと：〇〇」と表示される
- 自由入力がある場合、「補足：〇〇」と表示される
- 必須項目が空の場合、送信できない
- 各報告が`submitReport`で送信できる
- 各報告の`status`が`reported`になる
- manager/supporter一覧に4報告の状態が反映される

## 36. TDD方針

### 36.1 テスト階層

- Unit Test
- Functions Emulator Test
- Security Rules Test
- Flutter Widget Test
- Flutter Integration Test
- Manual E2E

### 36.2 CI必須

CIでは以下を必須とする。

- TypeScript typecheck
- Unit Test
- Functions Emulator Test
- Security Rules Test

Flutter側は以下を実行する。

- `flutter analyze`
- `flutter test`

### 36.3 テストデータ

Factory関数 + seed JSONを併用する。

- Factory置き場: `functions/test/factories`
- seed JSON置き場: `firebase/seeds`

### 36.4 主要テスト対象

- `createNotificationUserProfile`
- `createNotificationSchedule`
- `generateDailyNotificationEvents`
- `sendDueNotificationReminders`
- `createModeSwitchRequest`
- `reviewModeSwitchRequest`
- `resolveRecipients`
- `submitReport`
- `generateDailyReportEvents`
- `sendDueReportReminders`
- Security Rules

## 37. MVP公開前チェックリスト

- 正式な個人名の運営者表記を確定する
- 独自ドメインメールを用意する
- 問い合わせフォームを用意する
- Amazon SESの利用を確定する
- Firebase / Google Cloudを外部委託先として記載する
- Amazon SESを外部委託先として記載する
- データ削除依頼フローを用意する
- 登録メールアドレス確認フローを用意する
- `users.active=false`による退会処理を用意する
- 保存期間経過後の削除/匿名化方針を用意する
- プライバシーポリシーを用意する
- 利用規約を用意する
- 問い合わせ窓口を用意する
- 通知・メール不達の免責を書く
- 人事評価・勤怠管理に使わない旨を書く
- センシティブ情報注意文を書く
- Push通知に本文、氏名、業務詳細が出ないことを確認する

## 38. 実装着手判定

| 対象 | 判定 |
| --- | --- |
| Phase 0 | 実装着手OK |
| Phase 1 通知モード | 実装着手OK |
| Phase 2 報告支援モード AM_START | 実装着手OKに近い |
| Phase 3 モード切り替え | 実装着手OKに近い |
| Phase 4 AM/PM 4報告 | AM_STARTを横展開する前提で実装可能 |
| MVP公開 | 自動テスト、手動E2E、プライバシーポリシー、利用規約、問い合わせ窓口が揃えば可能 |

## 39. 根拠

本ドキュメントは、添付PDF「ホウレンチェック 要件定義・詳細設計メモ」の内容を、実装参照しやすい詳細定義書として再構成したものである。

ホウレンチェックの要件の中心は、以下である。

- 報告忘れ防止
- 通知による報告タイミング支援
- 訓練期間中の報連相支援
- 一般就労移行時のコミュニケーション支援
- 就労定着支援
- 本人支援を目的とし、監視・人事評価・勤怠管理に寄せない設計
