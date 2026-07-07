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
}
