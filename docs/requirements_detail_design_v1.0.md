# ホウレンチェック 要件定義・詳細設計メモ

統合版 v1.0

## 1. プロダクト概要

### 1.1 プロダクト名

ホウレンチェック

### 1.2 一文定義

ホウレンチェックは、報連相忘れを防ぐための就労支援・業務報告支援アプリである。

### 1.3 中核価値

ホウレンチェックは、単なる報告リマインダーではない。

本アプリの中核価値は、以下である。

- 報告タイミングの通知
- 報告文作成の負担軽減
- 訓練期間中の報連相支援
- 就労支援系サービスから一般就労へ移行する際のコミュニケーション支援
- 一般就労後の定着支援

通知モードでは、ある程度自己管理できる人が、自分だけで報告タイミングを管理できるようにする。

報告支援モードでは、本人・上司・支援員・管理者が関わりながら、報告忘れ防止、相談、未報告確認、一般就労移行、定着支援を行う。

## 2. 解決する課題

### 2.1 主課題

リモート勤務や就労支援の場面で、業務開始・業務終了・進捗・相談などの定型報告を忘れてしまうことを防ぐ。

### 2.2 背景課題

- 報告タイミングを忘れる
- 報告文を考える負担がある
- 報告先が状況によって変わる
- 支援員中心から上司中心へ移行する過程で報連相が崩れやすい
- 未報告状態を本人支援に使いたいが、監視ツール化は避けたい
- ADHD傾向や報連相が苦手な人にとって、外部化された報告支援が必要

### 2.3 非目的

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

## 3. モード設計

### 3.1 モード一覧

ホウレンチェックは、以下の2つのモードを持つ。

| モード | accountMode | 概要 |
| --- | --- | --- |
| 通知モード | `notification_mode` | 本人だけで使える軽量な通知中心モード |
| 報告支援モード | `report_support_mode` | 上司・支援員・管理者が関与する本格支援モード |

## 4. 通知モード

### 4.1 概要

通知モードは、ある程度自己管理できる人向けのモードである。

主な機能は、報告タイミングを忘れないための通知である。

### 4.2 特徴

- 本人だけで使える
- 管理者・上司・支援員の紐づけは不要
- 本人がフォームから新規登録できる
- AM開始 / AM終了 / PM開始 / PM終了を初期テンプレートとして持つ
- CUSTOM通知を自由追加できる
- 報告済みチェックはMVPでは持たない
- 報告本文、送信先、`reportDeliveries`、`assignments`、`auditLogs`は原則使わない

### 4.3 通知モードでMVP対象外にするもの

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

### 4.4 通知モードで将来追加可能なもの

- 報告済みチェック
- 自分用メモ
- 報告文テンプレート
- 自己振り返り履歴
- Googleログイン
- 通知モードから報告支援モードへの移行履歴

## 5. 報告支援モード

### 5.1 概要

報告支援モードは、本人、上司、支援員、管理者が関わりながら、報告忘れ防止、報連相支援、一般就労移行、就労定着支援を行うモードである。

### 5.2 特徴

- worker / manager / supporter / admin を使う
- `assignments` が必要
- `workerSettings` を使う
- `reportSchedules` / `reportEvents` / `reports` / `reportDeliveries` を使う
- `selectedRecipients` / `excludedRecipients` を使う
- `auditLogs` を使う
- `employmentContext` を使う
- 一般就労移行・定着支援に対応する

## 6. モード切り替え

### 6.1 基本方針

通知モードから報告支援モードへの切り替えのみ可能。

- `notification_mode` -> `report_support_mode` は可能
- `report_support_mode` -> `notification_mode` は不可

理由は、報告支援モードでは上司・支援員・管理者、報告履歴、送信先、監査ログが絡むため、通知モードへ戻すとデータ整合性と権限管理が複雑になるため。

### 6.2 切り替え承認者

通知モードから報告支援モードへの切り替えは、本人が申請し、支援員または管理者が承認する。

### 6.3 切り替え申請方法

以下の2系統を許可する。

- 支援員または管理者からの招待リンク方式
- 本人による支援員メールアドレス入力方式

通常UIでは、支援員メールアドレス入力方式を表示する。

招待リンク方式は、URLから直接処理する。

### 6.4 切り替え先employmentContextと必須担当者

#### `general_employment` の場合

- `managerId` 必須
- `supporterId` 任意

#### `supported_facility` の場合

- `supporterId` 必須
- `managerId` 任意

## 7. 対応環境

### 7.1 MVP対象

- Flutter Web
- PWA
- Web Push通知
- メール通知
- アプリ内通知

### 7.2 将来対応

- Androidアプリ
- iOSアプリ
- Slack連携
- Chatwork連携
- Google Chat連携
- Microsoft Teams連携

### 7.3 MVP対象外

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

## 8. 技術方針

### 8.1 フロントエンド

- Flutter Web
- PWA
- Riverpod

### 8.2 バックエンド

- Firebase Authentication
- Firestore
- Cloud Functions
- Firebase Cloud Messaging
- Firebase Hosting

### 8.3 Cloud Functions

- TypeScript
- Jest
- `domain` / `usecase` / `repository` / `functions` に分割する

### 8.4 メール送信

Amazon SESを採用する。

用途：

- 通知モードのメールフォールバック
- 報告支援モードの報告メール送信
- `retryReportDelivery`による再送
- モード切り替え承認・却下通知
- 必要に応じた重要通知

### 8.5 テスト環境

- Firebase Emulator Suite
- Flutter local test
- CI
- Jest
- Security Rules Test
- Functions Emulator Test
