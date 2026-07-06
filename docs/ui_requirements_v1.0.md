# ホウレンチェック UI要件定義書

統合版 v1.0  
作成元:

- `画面遷移要件.pdf`
- `ホウレンチェック 画面構成・UI要件.pdf`

## 1. 文書目的

本書は、ホウレンチェックの画面構成、UI方針、画面遷移要件を1つのUI要件として統合したものである。

対象範囲は、ログイン前、通知モード、報告支援モードworker、manager、supporter、admin、モード切り替え、一般就労移行、例外時遷移、主要ルート、受け入れ条件である。

## 2. UI設計の基本方針

ホウレンチェックは、就労支援、リモート勤務、一般就労移行、定着支援の文脈で使われるため、画面全体は「落ち着き」「信頼感」「迷いにくさ」を重視する。

UIは以下を満たすことを基本方針とする。

- フォーマルな業務・支援の場で使っても違和感がない
- ADHD傾向や報連相が苦手な人でも迷いにくい
- 支援対象者を幼く扱わない
- 上司・支援員・管理者が使っても業務アプリとして自然
- 監視ツールではなく支援ツールとして見える
- 通知モードは軽く使える
- 報告支援モードは業務運用に耐える

避ける表現:

- 過度にポップな表現
- ゲーム的演出
- 強い装飾
- 煽る通知文
- 達成率競争のような見せ方

## 3. デザイン人格

### 3.1 避ける印象

- 子ども向け
- 医療アプリのように重すぎる
- 監視ツールのように見える
- ゲームアプリのように見える
- 勤怠管理システムのように硬すぎる
- 失敗を責める
- 未報告を罰のように見せる

### 3.2 目指す印象

- 落ち着いている
- 信頼できる
- やさしいが幼くない
- 事務的すぎない
- 報告しやすい
- 相談しやすい
- 支援者にも説明しやすい
- 職場で開いても恥ずかしくない

### 3.3 フォーマル利用に合わせたUI

職場で開いても違和感のない画面にするため、以下は避ける。

- キャラクター要素
- 派手なアニメーション
- 過度な達成演出
- ゲーム的なバッジ
- 強い励まし文

支援対象者を幼く扱わない。文言はやさしくするが、子ども扱いしない。

NG例:

- よくできました！
- 報告できてえらい！

OK例:

- 報告を送信しました。

## 4. 色・アクセシビリティ

### 4.1 全体トーン

全体の基調色は、白、薄いグレー、落ち着いたブルーグレーを中心にする。

- 背景は白またはごく薄いグレーを基本とする
- メインカラーは、落ち着いた青系またはブルーグレー系とする
- 強い赤、蛍光色、彩度の高い黄色、派手なグラデーションは原則使わない

### 4.2 推奨カラートーン

| 用途 | 推奨色の方向性 | 印象 |
| --- | --- | --- |
| メインカラー | ネイビー寄りのブルー / ブルーグレー | 信頼感・業務感 |
| 背景 | 白 / `#F7F8FA`系 | 清潔・読みやすい |
| カード背景 | 白 | 情報のまとまり |
| 境界線 | 薄いグレー | 控えめな区切り |
| 成功 | 落ち着いたグリーン | 完了・送信成功 |
| 注意 | 彩度を抑えたアンバー | 要確認 |
| エラー | 落ち着いたレッド | 失敗・要対応 |
| 未報告 | 赤ではなくアンバー中心 | 責めない表現 |

### 4.3 状態色

| 状態 | 色 | 表示ラベル例 |
| --- | --- | --- |
| 報告済み | 落ち着いたグリーン | 報告済み |
| 未報告 | アンバー | 未報告 |
| 相談あり | 青 | 相談あり |
| 送信失敗 | 落ち着いたレッド | メール送信失敗 |
| 通常 | ブルーグレー | 通常 |

### 4.4 色の使い分け

- 未報告や失敗状態を常に赤で表示しない
- 未報告は、まずアンバーや注意色で表示する
- 赤は、メール送信失敗、権限エラー、削除確認など、ユーザーの明確な対応が必要な場合に限定する
- 相談は青で穏やかに表示する
- 色だけで状態を伝えず、必ずテキストまたはアイコンを併用する

### 4.5 アクセシビリティ

- 通常テキストと背景のコントラスト比は、原則としてWCAG 2.2 AAの4.5:1以上を満たす
- 大きな文字でも3:1以上を満たす
- 色だけで状態を伝えず、テキストまたはアイコンを併用する

## 5. レイアウト基本方針

### 5.1 画面密度

- 情報を詰め込みすぎない
- 1画面1目的を原則とする
- worker向け画面では、同時に多くの選択肢を見せすぎない
- workerには「今やること」「今日やること」を最優先で表示する

### 5.2 余白

- カード、入力欄、ボタン間には十分な余白を取る
- 余白により、情報のまとまりを視覚的に分ける

### 5.3 カード型レイアウト

通知、報告予定、報告履歴、申請、相談などはカード型で表示する。

カードには以下を含める。

- タイトル
- 状態
- 時刻
- 主操作ボタン
- 補助操作ボタン

### 5.4 ボタン配置

- 主操作ボタンは、画面下部またはカード下部に明確に配置する
- 主操作は1つに絞る
- 補助操作は控えめに置く

主操作例:

- 報告する
- 送信する
- 保存する
- 承認する

補助操作例:

- スヌーズ
- 編集
- キャンセル
- 戻る

## 6. 文言方針

### 6.1 全体文体

文体は丁寧で、簡潔にする。命令口調や責める表現は避ける。

### 6.2 避ける文言

- まだ報告していません
- 報告を忘れています
- 早く報告してください
- 未提出です
- 対応が遅れています

### 6.3 推奨文言

- 報告の時間です
- 未報告の項目があります
- 必要に応じて報告してください
- 送信できませんでした
- もう一度送信できます
- 相談事項があります
- 確認が必要です

### 6.4 通知文

通知文は短くする。通知文には、氏名、報告本文、相談内容、業務詳細、所属組織名を含めない。

通知文例:

- AM開始報告の時間です
- AM終了報告の時間です
- PM開始報告の時間です
- PM終了報告の時間です
- 通知の時間です
- 未報告の報告があります

## 7. 共通画面構造

### 7.1 ログイン前

対象画面:

- トップ
- 新規登録
- ログイン
- パスワード再設定
- 招待リンク受諾
- モード切り替え招待リンク受諾

画面方針:

- シンプルにする
- 文字量を少なくする
- 通知モードと報告支援モードの違いを簡潔に説明する

### 7.2 ログイン後ホーム分岐

ログイン後は、`accountMode`と`role`に応じてホームを分岐する。

```text
if not loggedIn:
  /login

if user.accountMode == notification_mode:
  /notification/home

if user.accountMode == report_support_mode && user.role == worker:
  /worker/home

if user.role == manager:
  /manager/home

if user.role == supporter:
  /supporter/home

if user.role == admin:
  /admin/home
```

MVPでは、1ユーザー1主要ロールを前提とする。将来、adminがworkerでもあるなど複数ロールを許可する場合は、role選択画面を追加する余地を残す。

## 8. 画面遷移の基本方針

ホウレンチェックでは、ログイン状態、`accountMode`、`role`に応じて表示する画面を分岐する。

画面遷移は、利用者が迷わないように以下を原則とする。

- ログイン後は必ず適切なホームへ自動遷移する
- workerには「今日やること」を最優先で表示する
- 通知から開いた場合は、対象の通知・報告画面へ直接遷移する
- 権限外の画面へアクセスした場合は、エラー画面ではなく自分のホームへ戻す
- 未ログイン状態で保護画面へアクセスした場合は、ログイン後に元の画面へ戻す
- モード切り替え後は、次回ログインまたは再読み込み時に新しいホームへ振り分ける

## 9. ログイン前画面

### 9.1 通常ログイン

```text
トップ
↓
ログイン
↓
認証成功
↓
accountMode / role 判定
↓
各ホーム
```

遷移先:

| 条件 | 遷移先 |
| --- | --- |
| `notification_mode` | 通知モードホーム |
| `report_support_mode + worker` | workerホーム |
| `manager` | managerホーム |
| `supporter` | supporterホーム |
| `admin` | adminホーム |

### 9.2 通知モード新規登録

通知モードの新規登録は、本人が自分で行える。

入力項目:

- 名前
- メールアドレス
- パスワード

主操作:

- 登録する

補助導線:

- ログインはこちら
- 利用規約
- プライバシーポリシー

画面要件:

- 管理者、上司、支援員の登録は求めない
- 「まずは自分だけで通知を使えます」と説明する
- フォームは1カラムにする
- エラーは入力欄の直下に表示する

遷移:

```text
トップ
↓
新規登録
↓
メールアドレス + パスワード登録
↓
createNotificationUserProfile
↓
通知許可画面
↓
初期通知確認画面
↓
通知モードホーム
```

登録完了条件:

- `users`作成
- `users.accountMode = notification_mode`
- `users.role = worker`
- `notificationSettings`作成
- 初期4種`notificationSchedules`作成

FCM token登録は登録完了条件には含めない。

### 9.3 パスワード再設定

```text
ログイン
↓
パスワードを忘れた場合
↓
メールアドレス入力
↓
再設定メール送信
↓
ログイン画面へ戻る
```

### 9.4 招待リンク受諾

報告支援モードの招待リンクを開いた場合の遷移。

```text
招待リンクを開く
↓
ログイン状態確認
↓
未ログインならログイン / 新規パスワード設定
↓
招待トークン検証
↓
招待内容確認
↓
招待を受諾
↓
acceptInvitation
↓
role / accountMode 判定
↓
該当ホームへ遷移
```

トークンが無効または期限切れの場合:

```text
招待リンクを開く
↓
トークン検証失敗
↓
招待リンク無効画面
↓
ログイン画面または問い合わせ導線
```

## 10. 通知モード画面

### 10.1 通知許可画面

目的:

- Web Push通知の許可を促す

表示文例:

> 通知を許可すると、報告タイミングを画面上で受け取れます。  
> 許可しない場合は、メール通知で代替できます。

主操作:

- 通知を許可する

補助操作:

- 後で設定する

通知拒否時:

- 利用開始は継続する
- アプリ内警告を表示する
- メールフォールバックを有効化する

遷移:

```text
通知許可画面
↓
通知拒否
↓
アプリ内警告表示
↓
メールフォールバック有効化
↓
初期通知確認画面
↓
通知モードホーム
```

### 10.2 初期通知確認画面

目的:

- AM/PM 4種の通知設定を確認・編集する

表示対象:

- `AM_START`
- `AM_END`
- `PM_START`
- `PM_END`

編集可能項目:

- 時刻
- 曜日
- 有効/無効

編集不可項目:

- タイトル
- `type`

レイアウト:

- AM/PM 4種を縦並びカードで表示
- 各カードに時刻、曜日、有効/無効スイッチを表示
- 「後で変更できます」と表示する

遷移:

```text
新規登録
↓
通知許可画面
↓
初期通知確認画面
↓
通知モードホーム
```

### 10.3 通知モードホーム

目的:

- 今日の通知と次の通知を確認する

表示内容:

- 今日の通知一覧
- 次の通知
- CUSTOM作成ボタン
- 通知スケジュール一覧への導線
- 簡易通知履歴への導線
- 報告支援モード切替導線

カード例:

```text
次の通知
AM開始報告の時間です
10:00
[スヌーズ] [キャンセル]
```

報告支援モード切替導線の説明文:

> 支援員や上司と報告を共有したい場合は、報告支援モードへ切り替えできます。

主操作:

- CUSTOM通知を作成

補助操作:

- 通知履歴を見る
- 報告支援モードに切り替える

遷移:

```text
通知モードホーム
├─ 今日の通知詳細
├─ CUSTOM通知作成
├─ 通知スケジュール一覧
├─ 簡易通知履歴
├─ 設定
└─ 報告支援モード切り替え申請
```

### 10.4 通知スケジュール一覧画面

表示形式:

- AM/PM通知とCUSTOM通知をタブで分ける

タブ:

- AM/PM通知
- CUSTOM通知

AM/PM通知タブ:

- `AM_START`
- `AM_END`
- `PM_START`
- `PM_END`

CUSTOM通知タブ:

- CUSTOM通知一覧
- 新規作成ボタン

遷移:

```text
通知モードホーム
↓
通知スケジュール一覧
├─ AM/PM通知タブ
│  ├─ AM_START編集
│  ├─ AM_END編集
│  ├─ PM_START編集
│  └─ PM_END編集
└─ CUSTOM通知タブ
   ├─ CUSTOM通知作成
   └─ CUSTOM通知編集
```

AM/PM通知編集後:

```text
AM/PM通知編集
↓
保存
↓
通知スケジュール一覧へ戻る
```

CUSTOM通知作成後:

```text
CUSTOM通知作成
↓
保存
↓
通知スケジュール一覧のCUSTOM通知タブへ戻る
```

CUSTOM通知削除後:

```text
CUSTOM通知編集
↓
削除確認
↓
論理削除
↓
通知スケジュール一覧のCUSTOM通知タブへ戻る
```

### 10.5 AM/PM通知編集画面

目的:

- 初期4種の通知時刻・曜日・有効/無効を編集する

編集可能項目:

- 時刻
- 曜日
- 有効/無効

編集不可項目:

- タイトル
- `type`

削除:

- 不可

無効化:

- 可能

理由:

- `AM_START` / `AM_END` / `PM_START` / `PM_END` は、報告支援モードへの切り替え時に`reportSchedules`へ変換する可能性があるため、意味を崩さない

### 10.6 CUSTOM通知作成・編集画面

目的:

- 個人用の通知を作成・編集する

入力項目:

- タイトル
- 時刻
- 曜日
- スヌーズ

上限:

- CUSTOM通知は最大10件

削除:

- 論理削除可能

メールフォールバック:

- 通知ごとではなく全体設定で扱う

### 10.7 通知イベントからの遷移

Web Push通知をクリックした場合:

```text
Web Push通知クリック
↓
ログイン状態確認
↓
未ログインならログイン
↓
対象notificationEvent確認
↓
通知モードホームまたは通知詳細へ遷移
```

通知対象がキャンセル済み・期限切れの場合:

```text
通知クリック
↓
対象event確認
↓
eventが存在しない / finalized
↓
通知モードホームへ遷移
↓
「この通知はすでに処理済みです」と表示
```

### 10.8 簡易通知履歴画面

表示対象:

- 過去30日分の通知履歴

表示項目:

- 通知日時
- 通知タイトル
- 通知種別
- 通知ステータス
- 通知チャネル

注意文:

> この履歴は通知の送信履歴です。実際に報告したかどうかを記録するものではありません。

遷移:

```text
通知モードホーム
↓
簡易通知履歴
↓
履歴詳細
↓
簡易通知履歴へ戻る
```

## 11. 報告支援モード worker画面

### 11.1 workerホーム

目的:

- 今日必要な報告だけを確認する

表示内容:

- 今日の報告予定
- 次の報告
- 未報告の報告
- 相談返信通知
- 履歴への導線

表示方針:

- 「今やること」を最優先表示
- 全タスク一覧を最初から見せすぎない
- 未報告は責めずに表示する

カード例:

```text
次の報告
AM開始報告
10:00
[報告する]
[スヌーズ]
```

遷移:

```text
workerホーム
├─ 今日の報告予定
├─ 次の報告
├─ 未報告一覧
├─ 報告履歴
├─ 相談返信
├─ 設定
└─ 一般就労移行希望申請
```

### 11.2 worker報告作成画面

対象:

- `AM_START`
- `AM_END`
- `PM_START`
- `PM_END`

表示内容:

- 報告種別
- 予定時刻
- 入力欄
- 生成文プレビュー
- 送信先選択
- センシティブ情報注意文

共通操作:

- 送信する
- 下書き保存
- 戻る

送信先:

- `employmentContext`に応じて初期表示
- `workerSettings`に基づいて追加・除外可能

注意文:

> 業務報告に必要な内容を入力してください。体調・診断名・家庭事情など、業務報告に不要な個人情報は入力しないでください。

共通遷移:

```text
workerホーム
↓
今日の報告予定を選択
↓
報告作成画面
↓
入力
↓
生成文プレビュー
↓
送信先確認
↓
送信確認
↓
submitReport
↓
送信完了画面
↓
workerホーム
```

### 11.3 AM_START報告画面

入力項目:

- 今日やること
- 相談事項
- 自由入力

生成文:

```text
おはようございます。
これから午前の作業を開始します。
本日は〇〇に取り組みます。
```

相談事項がある場合:

```text
相談したいこと：〇〇
```

自由入力がある場合:

```text
補足：〇〇
```

遷移:

```text
workerホーム
↓
AM_STARTカード「報告する」
↓
AM_START報告画面
↓
今日やること入力
↓
相談事項入力 任意
↓
自由入力 任意
↓
生成文確認
↓
送信先確認
↓
送信
↓
完了画面
↓
workerホーム
```

### 11.4 AM_END報告画面

入力項目:

- 完了したこと
- 残っていること
- 次にやること
- 相談事項
- 自由入力

生成文:

```text
午前の作業を終えました。
完了したこと：〇〇。
残っていること：△△。
```

遷移:

```text
workerホーム
↓
AM_ENDカード「報告する」
↓
AM_END報告画面
↓
完了したこと入力
↓
残っていること入力 任意
↓
次にやること入力 任意
↓
相談事項入力 任意
↓
自由入力 任意
↓
生成文確認
↓
送信先確認
↓
送信
↓
完了画面
↓
workerホーム
```

### 11.5 PM_START報告画面

入力項目:

- この時間帯にやること
- 相談事項
- 自由入力

生成文:

```text
午後の作業を開始します。
これから〇〇に取り組みます。
```

遷移:

```text
workerホーム
↓
PM_STARTカード「報告する」
↓
PM_START報告画面
↓
この時間帯にやること入力
↓
相談事項入力 任意
↓
自由入力 任意
↓
生成文確認
↓
送信先確認
↓
送信
↓
完了画面
↓
workerホーム
```

### 11.6 PM_END報告画面

入力項目:

- 完了したこと
- 残っていること
- 次回やること
- 相談事項
- 自由入力

生成文:

```text
本日の作業を終えました。
完了したこと：〇〇。
残っていること：△△。
次回やること：□□。
```

遷移:

```text
workerホーム
↓
PM_ENDカード「報告する」
↓
PM_END報告画面
↓
完了したこと入力
↓
残っていること入力 任意
↓
次回やること入力 任意
↓
相談事項入力 任意
↓
自由入力 任意
↓
生成文確認
↓
送信先確認
↓
送信
↓
完了画面
↓
workerホーム
```

### 11.7 報告送信失敗時

メール送信に失敗しても、report自体は`reported`とする。

```text
送信
↓
reports作成成功
↓
reportEvents.status = reported
↓
メールdelivery失敗
↓
送信完了画面
↓
「一部の通知送信に失敗しました」と表示
↓
再送ボタン表示
```

再送フロー:

```text
送信完了画面 / 履歴詳細
↓
再送する
↓
retryReportDelivery
↓
再送成功
↓
状態更新
```

### 11.8 worker報告履歴画面

表示内容:

- 自分の過去90日分の報告履歴
- 報告種別
- 報告日時
- 送信先
- 送信状態
- 相談有無

workerは自分の`reports`を直接読める。

遷移:

```text
workerホーム
↓
報告履歴
↓
報告詳細
├─ 訂正版作成
├─ 相談スレッド
└─ 再送
```

訂正版作成:

```text
報告詳細
↓
訂正版を作成
↓
訂正理由入力
↓
訂正文入力
↓
createReportCorrection
↓
報告詳細へ戻る
```

### 11.9 相談返信

```text
workerホーム
↓
相談返信通知
↓
相談スレッド詳細
↓
返信入力
↓
createReportReply
↓
相談スレッド詳細へ戻る
```

相談完了:

```text
相談スレッド詳細
↓
完了にする
↓
closeConsultationThread
↓
workerホームまたは相談一覧へ戻る
```

## 12. manager画面

### 12.1 managerホーム

目的:

- 担当workerの当日報告状況を確認する

表示内容:

- 担当worker一覧
- 当日の報告状態
- 未報告状態
- 相談あり表示

本文:

- 一覧では本文を返さず、短いsummaryのみ表示する

遷移:

```text
managerホーム
├─ 担当worker当日一覧
├─ 相談あり一覧
├─ 未報告一覧
└─ 設定
```

### 12.2 manager当日報告一覧

表示項目:

- worker名
- AM_START状態
- AM_END状態
- PM_START状態
- PM_END状態
- 相談有無
- 最終報告時刻

通常報告:

- 当日分のみ閲覧

相談報告:

- 過去90日分まで閲覧可能

遷移:

```text
managerホーム
↓
担当worker当日一覧
↓
worker行を選択
↓
当日報告詳細
↓
必要に応じて相談返信
↓
managerホームへ戻る
```

manager一覧では本文は表示しない。本文閲覧は`getManagerReportDetail` API経由とする。

### 12.3 manager報告詳細

- managerが本文を見る場合は、`getManagerReportDetail` APIを使う
- managerの本文閲覧では`auditLogs`を残さない

### 12.4 manager相談返信

```text
managerホーム
↓
相談あり一覧
↓
相談スレッド詳細
↓
返信入力
↓
createReportReply
↓
相談スレッド詳細へ戻る
```

## 13. supporter画面

### 13.1 supporterホーム

目的:

- 担当workerの状態を支援視点で確認する

表示内容:

- 担当worker一覧
- 今日の報告状態
- 未報告状態
- 相談あり
- `employmentContext`
- `activeTransitionId`

遷移:

```text
supporterホーム
├─ 担当worker一覧
├─ 未報告一覧
├─ 相談あり一覧
├─ 一般就労移行中一覧
├─ モード切り替え申請一覧
└─ 設定
```

### 13.2 supporter担当worker一覧

表示項目:

- worker名
- `accountMode`
- `employmentContext`
- 今日の報告状態
- 一般就労移行状態
- 最終報告時刻

遷移:

```text
supporterホーム
↓
担当worker一覧
↓
worker詳細
├─ 今日の報告状態
├─ 報告履歴
├─ 相談スレッド
├─ スケジュール設定
└─ 一般就労移行設定
```

### 13.3 supporter報告詳細

- supporterがreport本文を見る場合は、`getSupporterWorkerReport` APIを使う
- supporterは担当workerの過去90日分の報告本文を閲覧できる
- supporterの本文閲覧では`auditLogs`を残さない

遷移:

```text
worker詳細
↓
報告履歴
↓
報告詳細
↓
必要に応じて相談返信
↓
worker詳細へ戻る
```

## 14. admin画面

### 14.1 adminホーム

目的:

- 組織全体の利用者、ロール、担当者、監査ログを管理する

表示内容:

- ユーザー管理
- 招待管理
- ロール管理
- 担当者紐づけ
- 申請管理
- 監査ログ

遷移:

```text
adminホーム
├─ ユーザー管理
├─ 招待管理
├─ ロール管理
├─ 担当者紐づけ
├─ モード切り替え申請管理
├─ 一般就労移行管理
├─ 監査ログ
└─ 設定
```

### 14.2 ユーザー一覧画面

表示項目:

- 名前
- メールアドレス
- `role`
- `accountMode`
- `active`
- `organizationId`
- 招待状態

操作:

- 招待
- ロール変更
- 停止
- 詳細

### 14.3 ユーザー招待

```text
adminホーム
↓
ユーザー管理
↓
招待作成
↓
メールアドレス入力
↓
role選択
↓
招待送信
↓
招待管理へ戻る
```

### 14.4 ロール変更

```text
adminホーム
↓
ユーザー管理
↓
ユーザー詳細
↓
ロール変更
↓
確認
↓
updateUserRole
↓
ユーザー詳細へ戻る
```

ロール変更は`auditLogs`に記録する。

### 14.5 担当者紐づけ画面

表示項目:

- worker
- manager
- supporter

操作:

- 紐づけ
- 変更
- 無効化

担当者紐づけはAPI経由で行う。

遷移:

```text
adminホーム
↓
担当者紐づけ
↓
worker選択
↓
manager選択
↓
supporter選択
↓
保存
↓
assignUser
↓
担当者紐づけ一覧へ戻る
```

担当者紐づけは`auditLogs`に記録する。

### 14.6 監査ログ画面

表示項目:

- 操作者
- 操作種別
- 対象
- 理由
- 日時

adminのみ閲覧可能。

遷移:

```text
adminホーム
↓
監査ログ
↓
検索・絞り込み
↓
監査ログ詳細
↓
監査ログ一覧へ戻る
```

### 14.7 admin報告本文閲覧

- adminが報告本文を見る場合は、`getReportForAdmin` APIを使う
- reason入力を必須とする
- 閲覧時に`auditLogs.report_viewed`を必ず保存する

遷移:

```text
adminホーム
↓
ユーザー管理
↓
worker詳細
↓
報告履歴
↓
報告本文閲覧理由入力
↓
getReportForAdmin
↓
報告詳細表示
```

## 15. モード切り替え画面

### 15.1 worker切り替え申請画面

入口:

- 通知モードホーム
- 設定画面

通常UI:

- 支援員メール入力方式

入力項目:

- 支援員メールアドレス
- 希望`employmentContext`
- メッセージ

遷移:

```text
通知モードホーム または 設定画面
↓
報告支援モード切り替え案内
↓
支援員メール入力画面
↓
希望employmentContext選択
↓
メッセージ入力
↓
申請確認
↓
createModeSwitchRequest
↓
申請中画面
↓
通知モードホームに申請中ステータス表示
```

### 15.2 招待リンク経由申請画面

URL例:

```text
/mode-switch/invite/:token
```

処理:

1. workerが招待リンクを開く
2. 未ログインならログインへ誘導
3. tokenを検証
4. `organizationId` / `supporterId` / `adminId`を取得
5. 希望`employmentContext`とメッセージを入力
6. `createModeSwitchRequest`を実行

遷移:

```text
招待リンクを開く
↓
ログイン状態確認
↓
未ログインならログイン
↓
token検証
↓
切り替え申請画面
↓
希望employmentContext選択
↓
メッセージ入力
↓
申請確認
↓
createModeSwitchRequest
↓
申請中画面
```

### 15.3 申請中画面

表示文:

> 報告支援モードへの切り替え申請中です。  
> 支援員または管理者の承認を待っています。

- 申請中は再申請できない
- 申請取り消し後は再申請可能

pending申請がある場合:

```text
報告支援モード切り替え導線を選択
↓
既存pending申請確認
↓
申請中画面を表示
├─ 申請内容を見る
└─ 申請を取り消す
```

pending申請がある場合、新規申請は作成しない。

申請取り消し:

```text
申請中画面
↓
申請を取り消す
↓
確認ダイアログ
↓
cancelModeSwitchRequest
↓
通知モードホーム
```

取り消し後は再申請可能。

### 15.4 却下理由表示画面

表示文:

> 報告支援モードへの切り替え申請は承認されませんでした。  
> 理由：  
> 〇〇  
> 内容を修正して再申請できます。

worker側遷移:

```text
通知モードホーム
↓
却下通知表示
↓
却下理由表示画面
↓
再申請導線
```

### 15.5 supporter/admin申請一覧画面

表示項目:

- 申請者名
- 申請者メールアドレス
- 希望`employmentContext`
- メッセージ
- 申請日時
- `status`

### 15.6 supporter/admin承認画面

表示項目:

- 申請者情報
- 希望`employmentContext`
- メッセージ
- manager紐づけ
- supporter紐づけ
- スケジュール引き継ぎ選択

MVPのスケジュール引き継ぎ選択:

- `none`
- `convert_am_pm`

承認遷移:

```text
supporter/adminホーム
↓
モード切り替え申請一覧
↓
申請詳細
↓
manager/supporter紐づけ
↓
scheduleMigrationPolicy選択
↓
承認確認
↓
reviewModeSwitchRequest
↓
承認完了
↓
申請一覧へ戻る
```

承認後:

```text
worker.users.accountMode = report_support_mode
workerSettings作成
assignments作成
必要に応じてreportSchedules作成
auditLogs.mode_switched作成
```

worker側:

```text
次回ログイン または 再読み込み
↓
accountMode判定
↓
workerホームへ遷移
```

却下遷移:

```text
supporter/adminホーム
↓
モード切り替え申請一覧
↓
申請詳細
↓
却下
↓
reviewComment入力
↓
reviewModeSwitchRequest
↓
却下完了
↓
申請一覧へ戻る
```

## 16. 一般就労移行画面

### 16.1 workerによる移行希望申請

```text
workerホーム
↓
一般就労移行希望
↓
希望内容入力
↓
希望開始日入力
↓
メッセージ入力
↓
申請確認
↓
createEmploymentTransitionRequest
↓
申請中画面
```

### 16.2 supporter/adminによる移行設定

```text
supporter/adminホーム
↓
一般就労移行申請一覧
↓
申請詳細
↓
移行設定作成
↓
oldManager / newManager設定
↓
oldSupporter / newSupporter設定
↓
transitionRecipientPolicy設定
↓
startEmploymentContextTransition
↓
移行中状態へ
```

### 16.3 移行完了

```text
移行中worker詳細
↓
移行完了確認
↓
completionReason入力
↓
completeEmploymentContextTransition
↓
workerSettings更新
↓
移行完了
```

## 17. エラー・例外時の画面遷移

### 17.1 未ログインで保護画面にアクセス

```text
保護画面URLへアクセス
↓
未ログイン判定
↓
ログイン画面
↓
ログイン成功
↓
元のURLへ戻る
```

### 17.2 権限外画面アクセス

```text
権限外URLへアクセス
↓
role / accountMode判定
↓
アクセス不可
↓
自分のホームへ遷移
↓
「この画面を表示する権限がありません」と表示
```

権限外エラーでは、対象データの存在有無が分からないようにする。

### 17.3 データが存在しない場合

```text
詳細URLへアクセス
↓
対象データ取得
↓
存在しない
↓
一覧またはホームへ戻る
↓
「対象のデータが見つかりません」と表示
```

### 17.4 送信済み`reportEvent`に再アクセス

```text
報告URLへアクセス
↓
reportEvent.status確認
↓
reported
↓
報告済み画面へ遷移
↓
「この報告は送信済みです」と表示
```

### 17.5 `deletedAt`済み通知にアクセス

```text
通知詳細URLへアクセス
↓
notificationSchedule.deletedAt確認
↓
削除済み
↓
通知モードホームへ戻る
↓
「この通知は削除されています」と表示
```

## 18. 主要ルート案

### 18.1 ログイン前

| ルート | 画面 |
| --- | --- |
| `/` | トップ |
| `/login` | ログイン |
| `/register` | 通知モード新規登録 |
| `/password-reset` | パスワード再設定 |
| `/invite/:token` | 招待リンク受諾 |
| `/mode-switch/invite/:token` | モード切り替え招待リンク |

### 18.2 通知モード

- `/notification/home`
- `/notification/permission`
- `/notification/initial-settings`
- `/notification/schedules`
- `/notification/schedules/am-pm/:scheduleId`
- `/notification/schedules/custom/new`
- `/notification/schedules/custom/:scheduleId`
- `/notification/logs`
- `/notification/settings`
- `/notification/mode-switch`
- `/notification/mode-switch/pending`
- `/notification/mode-switch/rejected`

### 18.3 worker

- `/worker/home`
- `/worker/today`
- `/worker/today/report/:eventId`
- `/worker/reports`
- `/worker/reports/:reportId`
- `/worker/reports/:reportId/correction`
- `/worker/consultations`
- `/worker/consultations/:threadId`
- `/worker/settings`
- `/worker/employment-transition/request`
- `/worker/employment-transition/pending`

### 18.4 manager

- `/manager/home`
- `/manager/workers`
- `/manager/workers/:workerId/today`
- `/manager/reports/:reportId`
- `/manager/consultations`
- `/manager/consultations/:threadId`
- `/manager/settings`

### 18.5 supporter

- `/supporter/home`
- `/supporter/workers`
- `/supporter/workers/:workerId`
- `/supporter/workers/:workerId/reports`
- `/supporter/reports/:reportId`
- `/supporter/consultations`
- `/supporter/consultations/:threadId`
- `/supporter/mode-switch-requests`
- `/supporter/mode-switch-requests/:requestId`
- `/supporter/employment-transitions`
- `/supporter/employment-transitions/:transitionId`
- `/supporter/settings`

### 18.6 admin

- `/admin/home`
- `/admin/users`
- `/admin/users/:userId`
- `/admin/invitations`
- `/admin/roles`
- `/admin/assignments`
- `/admin/mode-switch-requests`
- `/admin/mode-switch-requests/:requestId`
- `/admin/employment-transitions`
- `/admin/employment-transitions/:transitionId`
- `/admin/audit-logs`
- `/admin/audit-logs/:auditLogId`
- `/admin/settings`

## 19. 手動E2E方針

- 手動E2EはPhaseごとに分ける
- 通知モード、報告支援モード、モード切替でも分ける
- 実メール確認はリリース前のみ行う
- 複数ロールログインは、複数ブラウザまたはシークレットウィンドウで確認する

MVPリリース判定:

- 自動テスト
- 手動E2E
- プライバシーポリシー確認

## 20. 画面遷移・UI受け入れ条件

### 20.1 共通

- [ ] 未ログインで保護画面にアクセスした場合、ログイン後に元の画面へ戻る
- [ ] ログイン後、`accountMode` / `role`に応じたホームへ遷移する
- [ ] 権限外画面にアクセスした場合、自分のホームへ戻る
- [ ] 権限外エラーで対象データの存在有無を漏らさない
- [ ] データが存在しない場合、一覧またはホームへ戻る
- [ ] 主要状態は色だけでなくテキストまたはアイコンでも判別できる
- [ ] 通常テキストはWCAG 2.2 AA相当のコントラスト比を満たす
- [ ] 未報告を赤で責める表現にしない

### 20.2 通知モード

- [ ] 新規登録後、通知許可画面へ遷移する
- [ ] 通知許可後、初期通知確認画面へ遷移する
- [ ] 初期通知確認後、通知モードホームへ遷移する
- [ ] 通知拒否時も初期通知確認画面へ進める
- [ ] 通知モードホームからCUSTOM通知作成へ遷移できる
- [ ] 通知モードホームから通知履歴へ遷移できる
- [ ] 通知モードホームから報告支援モード切り替え申請へ遷移できる
- [ ] 初期4種通知のタイトルと`type`は編集できない
- [ ] CUSTOM通知は最大10件まで作成できる
- [ ] 通知履歴に「報告済み履歴ではない」旨が表示される

### 20.3 報告支援モード worker

- [ ] workerホームから各報告作成画面へ遷移できる
- [ ] 報告送信後、送信完了画面を経てworkerホームへ戻る
- [ ] 送信済みeventに再アクセスした場合、報告済み画面が表示される
- [ ] 報告履歴から報告詳細へ遷移できる
- [ ] 相談返信通知から相談スレッドへ遷移できる
- [ ] 報告入力画面にセンシティブ情報注意文が表示される
- [ ] 生成文プレビューと送信先確認を経由して送信できる

### 20.4 manager / supporter / admin

- [ ] managerは担当worker一覧から当日報告詳細へ遷移できる
- [ ] manager一覧では報告本文を表示しない
- [ ] supporterは担当worker一覧からworker詳細へ遷移できる
- [ ] supporterはモード切り替え申請一覧から承認画面へ遷移できる
- [ ] adminはユーザー一覧からユーザー詳細へ遷移できる
- [ ] adminは監査ログ一覧から監査ログ詳細へ遷移できる
- [ ] adminが報告本文を見る場合、理由入力画面を経由する
- [ ] adminの報告本文閲覧時に`auditLogs.report_viewed`を保存する

### 20.5 モード切り替え

- [ ] 通知モードホームから切り替え申請画面へ遷移できる
- [ ] 設定画面から切り替え申請画面へ遷移できる
- [ ] 申請後、申請中画面へ遷移する
- [ ] pending申請中は申請中画面へ遷移し、新規申請できない
- [ ] 却下後、却下理由画面へ遷移できる
- [ ] 承認後、次回ログイン時にworkerホームへ遷移する
- [ ] supporter/admin承認画面でmanager/supporter紐づけを設定できる
- [ ] `scheduleMigrationPolicy`として`none` / `convert_am_pm`を選択できる

## 21. 実装着手判定

| 対象 | 判定 |
| --- | --- |
| Phase 0 | 実装着手OK |
| Phase 1 通知モード | 実装着手OK |
| Phase 2 報告支援モード AM_START | 実装着手OKに近い |
| Phase 3 モード切り替え | 実装着手OKに近い |
| Phase 4 AM/PM 4報告 | AM_STARTを横展開する前提で実装可能 |

## 22. 根拠

本ドキュメントは、添付PDF「画面遷移要件」と「ホウレンチェック 画面構成・UI要件」を、UI実装時に参照しやすい1つのMarkdownとして統合したものである。

UIの色・アクセシビリティについては、WCAG 2.2のコントラスト基準を参照し、通常テキストと背景のコントラスト比は原則4.5:1以上を目標とする。

通知文・画面文言は、利用者が理解しやすい平易な表現を基本とし、未報告や失敗を責める表現は避ける。
