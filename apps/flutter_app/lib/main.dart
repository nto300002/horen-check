import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: HorenCheckApp()));
}

class HorenCheckApp extends StatelessWidget {
  const HorenCheckApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ホウレンチェック',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1F4F78),
        ),
        useMaterial3: true,
      ),
      home: const EnvironmentHomePage(),
    );
  }
}

class EnvironmentHomePage extends StatelessWidget {
  const EnvironmentHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ホウレンチェック'),
      ),
      body: const SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '環境構築プレビュー',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12),
              Text(
                '報連相忘れを防ぐための就労支援・業務報告支援アプリです。',
                style: TextStyle(fontSize: 18, height: 1.6),
              ),
              SizedBox(height: 24),
              _StatusTile(label: 'Frontend', value: 'Flutter Web'),
              _StatusTile(label: 'Backend', value: 'Cloud Functions'),
              _StatusTile(label: 'DB', value: 'Firestore'),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusTile extends StatelessWidget {
  const _StatusTile({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(label),
        subtitle: Text(value),
      ),
    );
  }
}
