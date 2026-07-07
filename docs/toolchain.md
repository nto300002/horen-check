# 開発ツールチェーン

## 必須ツール

| 用途 | ツール | 導入方法 |
| --- | --- | --- |
| Node services / Firebase CLI | Node.js 22 / npm | ローカル環境に導入済みのNodeを使う |
| Firebase CLI | `firebase-tools` | `npm ci`でdevDependencyとして導入 |
| Java Runtime | OpenJDK 21 | `brew bundle` |
| Flutter Web | Flutter stable | `brew bundle` |

## ローカル導入

```bash
brew bundle
npm ci
```

Flutterの初回確認:

```bash
flutter doctor
cd apps/flutter_app
flutter pub get
flutter analyze
flutter test
```

Firebase Emulator Suiteの確認:

```bash
npx firebase emulators:exec --only firestore "npm run test:rules" --project horen-check-rules-test
npx firebase emulators:exec --only functions "npm run test:functions:emulator" --project horen-check-rules-test
```

## CIでの導入

GitHub Actionsでは以下を使う。

- `actions/setup-node@v4`
- `actions/setup-java@v4`
- `subosito/flutter-action@v2`
- npm devDependencyの`firebase-tools`

## 現在のローカル制約

この作業環境では、作業時点で`flutter`とJava Runtimeが未導入だった。そのため、Flutter/Firebase Emulatorの実行はCIで検証する構成にしている。
