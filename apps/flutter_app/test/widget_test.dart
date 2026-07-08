import 'package:flutter/material.dart';
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
    expect(find.widgetWithText(OutlinedButton, '削除'), findsOneWidget);
  });

  testWidgets('renders admin users, invitations, roles, and assignments routes', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/admin/users'));

    expect(find.text('ユーザー管理'), findsWidgets);
    expect(find.text('ユーザーを招待'), findsOneWidget);
    expect(find.text('Worker One'), findsOneWidget);
    expect(find.text('停止中'), findsOneWidget);

    await tester.tap(find.text('ユーザーを招待'));
    await tester.pumpAndSettle();
    expect(find.text('招待管理'), findsWidgets);
    expect(find.text('招待メールアドレス'), findsOneWidget);
    expect(find.text('招待を送信'), findsOneWidget);
    expect(find.text('new-worker@example.com'), findsOneWidget);

    await tester.tap(find.widgetWithText(OutlinedButton, 'ロール管理').first);
    await tester.pumpAndSettle();
    expect(find.text('ロール管理'), findsWidgets);
    expect(find.text('ロール変更は監査ログに保存されます'), findsOneWidget);

    await tester.tap(find.widgetWithText(OutlinedButton, '担当者紐づけ').first);
    await tester.pumpAndSettle();
    expect(find.text('担当者紐づけ'), findsWidgets);
    expect(find.textContaining('manager: Manager One'), findsOneWidget);
    expect(find.text('担当解除'), findsOneWidget);
    expect(find.textContaining('active=false'), findsOneWidget);
  });

  testWidgets('renders worker AM_START report creation and retry affordance', (tester) async {
    await tester.pumpWidget(
      const HorenCheckApp(initialRoute: '/worker/today/report/event-1'),
    );

    expect(find.text('AM_START報告'), findsOneWidget);
    expect(find.text('対象イベント'), findsOneWidget);
    expect(find.text('event-1'), findsOneWidget);
    expect(find.text('今日やること'), findsOneWidget);
    expect(find.text('相談事項'), findsOneWidget);
    expect(find.text('自由入力'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.textContaining('本日は在庫確認に取り組みます。').first,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('生成文確認'), findsOneWidget);
    expect(find.textContaining('本日は在庫確認に取り組みます。'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('送信先確認').first,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('送信先確認'), findsOneWidget);
    expect(find.text('Supporter One'), findsOneWidget);
    expect(find.text('Manager One'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('再送').first,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('送信完了'), findsOneWidget);
    expect(find.text('reported'), findsOneWidget);
    expect(find.widgetWithText(OutlinedButton, '再送'), findsOneWidget);
  });
}
