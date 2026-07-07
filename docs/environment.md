# 環境構築

## 目的

フロントエンド、DB、バックエンドをlocal/production profileで起動できる最小構成を提供する。

本PRのlocal/production profileは、実装初期段階で環境の接続を確認するための起動プロファイルである。Firebase本番プロジェクトへデプロイする場合は、`.firebaserc.example`をもとに`.firebaserc`を作成し、Firebase CLIで対象projectを指定する。

## サービス

| Profile | Frontend | Backend API | DB |
| --- | --- | --- | --- |
| local | `http://127.0.0.1:5173` | `http://127.0.0.1:5001` | `http://127.0.0.1:18080` |
| production | `http://127.0.0.1:4173` | `http://127.0.0.1:5002` | `http://127.0.0.1:8081` |

## 起動

```bash
npm run dev
```

```bash
npm run prod
```

個別起動:

```bash
npm run dev:frontend
npm run dev:api
npm run dev:db
```

```bash
npm run prod:frontend
npm run prod:api
npm run prod:db
```

## 受け入れ確認

```bash
npm test
npm run test:functions
npm run smoke:local
npm run smoke:production
```

Firebase Emulator Suiteを使う確認:

```bash
npx firebase emulators:exec --only firestore "npm run test:rules" --project horen-check-rules-test
npx firebase emulators:exec --only functions "npm run test:functions:emulator" --project horen-check-rules-test
```

確認するエンドポイント:

```bash
curl http://127.0.0.1:5173/health
curl http://127.0.0.1:5001/health
curl http://127.0.0.1:18080/health
```

```bash
curl http://127.0.0.1:4173/health
curl http://127.0.0.1:5002/health
curl http://127.0.0.1:8081/health
```

## Firebase本番化メモ

1. Firebase projectを作成する。
2. `.firebaserc.example`をコピーして`.firebaserc`を作成する。
3. `YOUR_FIREBASE_PRODUCTION_PROJECT_ID`を実project IDに置き換える。
4. `docs/toolchain.md`に沿ってFirebase CLI、Java、Flutterを導入する。
5. `firebase emulators:start`でFirebase Emulator Suiteを起動する。
6. `firebase deploy --project production`でHosting/Functions/Firestore Rulesをデプロイする。

## 現在の制約

この環境では`flutter`とJava Runtimeが未導入だったため、Flutter WebとFirebase Emulator Suiteの実起動はローカルでは完了していない。CIでは`subosito/flutter-action`と`actions/setup-java`で導入して検証する。Firebase CLIはnpm devDependencyとして導入している。接続確認用DBのlocal portは、既存プロセスと衝突しやすい`8080`を避けて`18080`にしている。
