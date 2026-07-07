import 'package:flutter_test/flutter_test.dart';
import 'package:horen_check/main.dart';

void main() {
  testWidgets('renders notification mode registration flow', (tester) async {
    await tester.pumpWidget(const HorenCheckApp());

    expect(find.text('ホウレンチェック'), findsOneWidget);
    expect(find.text('通知モード新規登録'), findsOneWidget);
    expect(find.text('まずは自分だけで通知を使えます。'), findsOneWidget);
    expect(find.text('名前'), findsOneWidget);
    expect(find.text('メールアドレス'), findsOneWidget);
    expect(find.text('パスワード'), findsOneWidget);
    expect(find.text('登録する'), findsOneWidget);
    expect(find.text('通知許可'), findsOneWidget);
    expect(find.text('初期通知確認'), findsOneWidget);
    expect(find.text('通知モードホーム'), findsOneWidget);
  });

  testWidgets('renders notification home with today and next notifications', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/notification/home'));

    expect(find.text('通知モードホーム'), findsOneWidget);
    expect(find.text('次の通知'), findsOneWidget);
    expect(find.text('今日の通知'), findsOneWidget);
    expect(find.text('AM開始報告の時間です'), findsWidgets);
    expect(find.text('スヌーズ'), findsOneWidget);
    expect(find.text('キャンセル'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('CUSTOM通知を作成'),
      300,
    );
    expect(find.text('CUSTOM通知を作成'), findsOneWidget);
    expect(find.text('通知スケジュール'), findsOneWidget);
    expect(find.text('通知履歴'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('報告支援モードへ切り替え'),
      300,
    );
    expect(find.text('報告支援モードへ切り替え'), findsOneWidget);
    expect(find.textContaining('支援員や上司と報告を共有'), findsOneWidget);
  });

  testWidgets('navigates from home to custom creation, schedules, logs, and settings', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/notification/home'));

    await tester.scrollUntilVisible(
      find.text('CUSTOM通知を作成'),
      300,
    );
    await tester.tap(find.text('CUSTOM通知を作成'));
    await tester.pumpAndSettle();
    expect(find.text('CUSTOM通知作成'), findsOneWidget);
    expect(find.text('タイトル'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('通知スケジュール'),
      300,
    );
    await tester.tap(find.text('通知スケジュール'));
    await tester.pumpAndSettle();
    expect(find.text('AM/PM通知'), findsOneWidget);
    expect(find.text('CUSTOM通知'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('通知履歴'),
      300,
    );
    await tester.tap(find.text('通知履歴'));
    await tester.pumpAndSettle();
    expect(find.text('通知履歴'), findsOneWidget);
    expect(find.textContaining('実際に報告したかどうかを記録するものではありません'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('設定'));
    await tester.pumpAndSettle();
    expect(find.text('Push通知'), findsOneWidget);
    expect(find.text('メールフォールバック'), findsOneWidget);
  });

  testWidgets('opens schedule edit screens from schedules page', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/notification/schedules'));

    await tester.tap(find.text('AM開始報告の時間です'));
    await tester.pumpAndSettle();
    expect(find.text('AM/PM通知編集'), findsOneWidget);
    expect(find.text('タイトルと種別は固定です'), findsOneWidget);
    expect(find.text('削除はできません'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.text('CUSTOM通知'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('水分補給'));
    await tester.pumpAndSettle();
    expect(find.text('CUSTOM通知編集'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('削除'),
      200,
    );
    expect(find.text('削除'), findsOneWidget);
  });
}
