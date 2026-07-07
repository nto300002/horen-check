import 'package:flutter_test/flutter_test.dart';
import 'package:horen_check/main.dart';

void main() {
  testWidgets('renders the environment preview', (tester) async {
    await tester.pumpWidget(const HorenCheckApp());

    expect(find.text('ホウレンチェック'), findsOneWidget);
    expect(find.text('環境構築プレビュー'), findsOneWidget);
    expect(find.text('Flutter Web'), findsOneWidget);
    expect(find.text('Cloud Functions'), findsOneWidget);
    expect(find.text('Firestore'), findsOneWidget);
  });
}
