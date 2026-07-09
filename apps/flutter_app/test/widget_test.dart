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
    expect(find.textContaining('停止中'), findsOneWidget);

    await tester.tap(find.text('Worker One'));
    await tester.pumpAndSettle();
    expect(find.text('ユーザー詳細'), findsOneWidget);
    expect(find.text('worker-1'), findsOneWidget);
    expect(find.text('worker@example.com'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

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

  testWidgets('renders manager report review without body in list and body in detail', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/manager/home'));

    expect(find.text('managerホーム'), findsOneWidget);
    expect(find.text('当日報告'), findsOneWidget);
    expect(find.text('4報告ステータス'), findsOneWidget);
    expect(find.textContaining('AM_END pending'), findsOneWidget);
    expect(find.text('Worker One'), findsOneWidget);
    expect(find.textContaining('相談あり'), findsOneWidget);
    expect(find.textContaining('優先順位について相談があります'), findsNothing);

    await tester.tap(find.text('Worker One'));
    await tester.pumpAndSettle();
    expect(find.text('当日報告詳細'), findsOneWidget);
    expect(find.text('報告本文'), findsOneWidget);
    expect(find.textContaining('優先順位について相談があります'), findsOneWidget);
    expect(find.text('相談返信'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/manager/consultations',
    ));
    expect(find.text('相談スレッド一覧'), findsOneWidget);
    expect(find.textContaining('open / Worker One'), findsOneWidget);

    await tester.tap(find.textContaining('open / Worker One'));
    await tester.pumpAndSettle();
    expect(find.text('相談スレッド'), findsOneWidget);
    expect(find.text('午後は商品登録から進めましょう'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, '返信する'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.widgetWithText(OutlinedButton, '完了にする'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.widgetWithText(OutlinedButton, '完了にする'), findsOneWidget);
  });

  testWidgets('renders supporter worker list and last 90 days report body', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/supporter/workers'));

    expect(find.text('担当worker一覧'), findsOneWidget);
    expect(find.text('Worker One'), findsOneWidget);
    expect(find.textContaining('最終報告: 2026/07/07'), findsOneWidget);

    await tester.tap(find.text('Worker One'));
    await tester.pumpAndSettle();
    expect(find.text('worker詳細'), findsOneWidget);
    expect(find.text('過去90日分'), findsOneWidget);
    expect(find.text('4報告ステータス'), findsOneWidget);
    expect(find.textContaining('PM_END pending'), findsOneWidget);
    expect(find.textContaining('AM_START / 2026/07/07'), findsOneWidget);

    await tester.tap(find.textContaining('AM_START / 2026/07/07'));
    await tester.pumpAndSettle();
    expect(find.text('報告詳細・相談返信'), findsOneWidget);
    expect(find.textContaining('優先順位について相談があります'), findsOneWidget);
    expect(find.text('相談返信'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/supporter/consultations',
    ));
    expect(find.text('相談スレッド一覧'), findsOneWidget);
    expect(find.textContaining('open / Worker One'), findsOneWidget);
  });

  testWidgets('renders worker consultation thread routes', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/worker/consultations'));

    expect(find.text('相談スレッド一覧'), findsOneWidget);
    expect(find.textContaining('open / AM_START'), findsOneWidget);

    await tester.tap(find.textContaining('open / AM_START'));
    await tester.pumpAndSettle();
    expect(find.text('相談スレッド'), findsOneWidget);
    expect(find.text('午後は商品登録から進めましょう'), findsOneWidget);
    expect(find.text('返信本文'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, '返信する'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.widgetWithText(OutlinedButton, '完了にする'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.widgetWithText(OutlinedButton, '完了にする'), findsOneWidget);
  });

  testWidgets('renders employment transition request and review routes', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/worker/employment-transition/request'));

    expect(find.text('一般就労移行希望申請'), findsOneWidget);
    expect(find.text('希望employmentContext'), findsOneWidget);
    expect(find.text('メッセージ'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, '申請する'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/worker/employment-transition/pending',
    ));
    expect(find.text('移行申請中'), findsOneWidget);
    expect(find.textContaining('general_employment / pending'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/supporter/employment-transitions',
    ));
    expect(find.text('一般就労移行一覧'), findsOneWidget);
    expect(find.textContaining('active / Worker One'), findsOneWidget);

    await tester.tap(find.textContaining('active / Worker One'));
    await tester.pumpAndSettle();
    expect(find.text('一般就労移行詳細'), findsOneWidget);
    expect(find.text('oldManagerId'), findsOneWidget);
    expect(find.text('newManagerId'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('transitionRecipientPolicy'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('transitionRecipientPolicy'), findsOneWidget);
    expect(find.text('完了理由'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.widgetWithText(FilledButton, '完了確認'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.widgetWithText(FilledButton, '完了確認'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.widgetWithText(OutlinedButton, 'キャンセル'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.widgetWithText(OutlinedButton, 'キャンセル'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/admin/employment-transitions',
    ));
    expect(find.text('一般就労移行管理'), findsOneWidget);
    expect(find.textContaining('active / Worker One'), findsOneWidget);
  });

  testWidgets('renders admin audit logs and reason-gated report body view', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/admin/audit-logs'));

    expect(find.text('監査ログ'), findsWidgets);
    expect(find.text('report_viewed'), findsOneWidget);
    expect(find.textContaining('支援記録確認'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/admin/reports/report-1',
    ));
    expect(find.text('報告本文閲覧'), findsOneWidget);
    expect(find.text('閲覧理由'), findsOneWidget);
    expect(find.text('理由を記録して本文を閲覧'), findsOneWidget);
    expect(find.textContaining('優先順位について相談があります'), findsOneWidget);
    expect(find.text('auditLogs.action'), findsOneWidget);
    expect(find.text('report_viewed'), findsOneWidget);
  });

  testWidgets('renders notification mode switch request, pending, and rejected flows', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/notification/mode-switch'));

    expect(find.text('報告支援モード切り替え申請'), findsOneWidget);
    expect(find.text('支援員メールアドレス'), findsOneWidget);
    expect(find.text('希望employmentContext'), findsOneWidget);
    expect(find.text('メッセージ'), findsOneWidget);
    expect(find.text('AM/PM通知を報告スケジュールへ移行'), findsOneWidget);

    await tester.tap(find.text('申請する'));
    await tester.pumpAndSettle();
    expect(find.text('切り替え申請中'), findsOneWidget);
    expect(find.text('pending'), findsOneWidget);
    expect(find.text('pending申請中は新規申請できません'), findsOneWidget);
    expect(find.text('申請を取り消して再申請'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/notification/mode-switch/rejected',
    ));
    expect(find.text('切り替え申請却下'), findsOneWidget);
    expect(find.textContaining('担当者確認後に再申請してください'), findsOneWidget);
    expect(find.text('再申請する'), findsOneWidget);
  });

  testWidgets('renders supporter and admin mode switch review screens', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/supporter/mode-switch-requests'));

    expect(find.text('モード切替申請一覧'), findsOneWidget);
    expect(find.text('Worker One'), findsOneWidget);
    expect(find.textContaining('supported_facility / pending'), findsOneWidget);

    await tester.tap(find.text('Worker One'));
    await tester.pumpAndSettle();
    expect(find.text('モード切替申請詳細'), findsOneWidget);
    expect(find.text('managerId'), findsOneWidget);
    expect(find.text('supporterId'), findsOneWidget);
    await tester.scrollUntilVisible(
      find.text('convert_am_pm'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('convert_am_pm'), findsOneWidget);
    expect(find.text('承認してworkerSettings/assignmentsを作成'), findsOneWidget);
    expect(find.text('却下する'), findsOneWidget);

    await tester.pumpWidget(HorenCheckApp(
      key: UniqueKey(),
      initialRoute: '/admin/mode-switch-requests',
    ));
    expect(find.text('モード切替申請管理'), findsOneWidget);
    expect(find.text('Worker One'), findsOneWidget);
    expect(find.text('Worker Two'), findsOneWidget);
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
      find.byKey(const Key('generatedReportText')),
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
      find.byKey(const Key('retryReportDeliveryButton')),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('送信完了'), findsOneWidget);
    expect(find.text('reported'), findsOneWidget);
    expect(find.widgetWithText(OutlinedButton, '再送'), findsOneWidget);
  });

  testWidgets('renders worker AM_END, PM_START, and PM_END report fields', (tester) async {
    const cases = [
      ('AM_END', '午前にできたこと', '午前は在庫確認まで完了しました。'),
      ('PM_START', '午後にやること', '午後は商品登録に取り組みます。'),
      ('PM_END', '今日できたこと', '本日は商品登録と在庫確認まで完了しました。'),
    ];

    for (final item in cases) {
      await tester.pumpWidget(
        HorenCheckApp(
          key: UniqueKey(),
          initialRoute: '/worker/today/report/event-${item.$1}',
        ),
      );

      expect(find.text('${item.$1}報告'), findsOneWidget);
      expect(find.text(item.$2), findsOneWidget);

      await tester.scrollUntilVisible(
        find.byKey(const Key('generatedReportText')),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.textContaining(item.$3), findsOneWidget);
    }
  });

  testWidgets('renders worker report history, detail, correction, and retry routes', (tester) async {
    await tester.pumpWidget(const HorenCheckApp(initialRoute: '/worker/reports'));

    expect(find.text('報告履歴'), findsOneWidget);
    expect(find.text('過去90日分'), findsOneWidget);
    expect(find.textContaining('AM_START / 2026/07/07'), findsOneWidget);

    await tester.tap(find.textContaining('AM_START / 2026/07/07'));
    await tester.pumpAndSettle();
    expect(find.text('報告詳細'), findsOneWidget);
    expect(find.text('reported'), findsOneWidget);
    expect(find.widgetWithText(OutlinedButton, '再送'), findsOneWidget);

    await tester.tap(find.text('訂正版作成'));
    await tester.pumpAndSettle();
    expect(find.text('訂正版作成'), findsWidgets);
    expect(find.text('訂正理由'), findsOneWidget);
    expect(find.text('訂正文'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, '訂正版を作成'), findsOneWidget);
  });
}
