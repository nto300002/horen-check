import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: HorenCheckApp()));
}

class HorenCheckApp extends StatelessWidget {
  const HorenCheckApp({
    super.key,
    this.initialRoute = '/',
  });

  final String initialRoute;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ホウレンチェック',
      initialRoute: initialRoute,
      onGenerateRoute: _buildRoute,
      onGenerateInitialRoutes: (initialRoute) => [
        _buildRoute(RouteSettings(name: initialRoute)),
      ],
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1F4F78),
        ),
        useMaterial3: true,
      ),
    );
  }
}

Route<void> _buildRoute(RouteSettings settings) {
  final name = settings.name ?? '/';

  if (name == '/') {
    return _pageRoute(settings, const RegisterPage());
  }
  if (name == '/notification/home') {
    return _pageRoute(settings, const NotificationHomePage());
  }
  if (name == '/notification/schedules') {
    return _pageRoute(settings, const NotificationSchedulesPage());
  }
  if (name.startsWith('/notification/schedules/am-pm/')) {
    final scheduleId = name.split('/').last;
    return _pageRoute(settings, AmPmScheduleEditPage(scheduleId: scheduleId));
  }
  if (name == '/notification/schedules/custom/new') {
    return _pageRoute(settings, const CustomScheduleEditPage());
  }
  if (name.startsWith('/notification/schedules/custom/')) {
    final scheduleId = name.split('/').last;
    return _pageRoute(settings, CustomScheduleEditPage(scheduleId: scheduleId));
  }
  if (name == '/notification/logs') {
    return _pageRoute(settings, const NotificationLogsPage());
  }
  if (name == '/notification/settings') {
    return _pageRoute(settings, const NotificationSettingsPage());
  }
  if (name == '/admin/users') {
    return _pageRoute(settings, const AdminUsersPage());
  }
  if (name == '/admin/invitations') {
    return _pageRoute(settings, const AdminInvitationsPage());
  }
  if (name == '/admin/roles') {
    return _pageRoute(settings, const AdminRolesPage());
  }
  if (name == '/admin/assignments') {
    return _pageRoute(settings, const AdminAssignmentsPage());
  }
  if (name.startsWith('/worker/today/report/')) {
    final eventId = name.split('/').last;
    return _pageRoute(settings, WorkerTodayReportPage(eventId: eventId));
  }

  return _pageRoute(settings, const NotificationHomePage());
}

MaterialPageRoute<void> _pageRoute(RouteSettings settings, Widget page) {
  return MaterialPageRoute<void>(
    settings: settings,
    builder: (_) => page,
  );
}

class NotificationSchedule {
  const NotificationSchedule({
    required this.id,
    required this.title,
    required this.type,
    required this.time,
    required this.weekdays,
    this.enabled = true,
    this.isCustom = false,
  });

  final String id;
  final String title;
  final String type;
  final String time;
  final String weekdays;
  final bool enabled;
  final bool isCustom;
}

class NotificationLogItem {
  const NotificationLogItem({
    required this.sentAt,
    required this.title,
    required this.type,
    required this.status,
    required this.channel,
  });

  final String sentAt;
  final String title;
  final String type;
  final String status;
  final String channel;
}

class AdminUserItem {
  const AdminUserItem({
    required this.name,
    required this.email,
    required this.role,
    required this.active,
  });

  final String name;
  final String email;
  final String role;
  final bool active;
}

class AdminInvitationItem {
  const AdminInvitationItem({
    required this.email,
    required this.role,
    required this.status,
    required this.expiresAt,
  });

  final String email;
  final String role;
  final String status;
  final String expiresAt;
}

class AdminAssignmentItem {
  const AdminAssignmentItem({
    required this.worker,
    required this.manager,
    required this.supporter,
    required this.active,
  });

  final String worker;
  final String manager;
  final String supporter;
  final bool active;
}

const amPmSchedules = [
  NotificationSchedule(
    id: 'AM_START',
    title: 'AM開始報告の時間です',
    type: 'AM_START',
    time: '09:00',
    weekdays: '月 火 水 木 金',
  ),
  NotificationSchedule(
    id: 'AM_END',
    title: 'AM終了報告の時間です',
    type: 'AM_END',
    time: '12:00',
    weekdays: '月 火 水 木 金',
  ),
  NotificationSchedule(
    id: 'PM_START',
    title: 'PM開始報告の時間です',
    type: 'PM_START',
    time: '13:00',
    weekdays: '月 火 水 木 金',
  ),
  NotificationSchedule(
    id: 'PM_END',
    title: 'PM終了報告の時間です',
    type: 'PM_END',
    time: '17:00',
    weekdays: '月 火 水 木 金',
  ),
];

const customSchedules = [
  NotificationSchedule(
    id: 'CUSTOM_1',
    title: '水分補給',
    type: 'CUSTOM',
    time: '10:30',
    weekdays: '月 水 金',
    isCustom: true,
  ),
];

const notificationLogs = [
  NotificationLogItem(
    sentAt: '2026/07/07 09:00',
    title: 'AM開始報告の時間です',
    type: 'AM_START',
    status: '送信済み',
    channel: 'push',
  ),
  NotificationLogItem(
    sentAt: '2026/07/07 10:30',
    title: '水分補給',
    type: 'CUSTOM',
    status: '送信済み',
    channel: 'email',
  ),
];

const adminUsers = [
  AdminUserItem(
    name: 'Worker One',
    email: 'worker@example.com',
    role: 'worker',
    active: true,
  ),
  AdminUserItem(
    name: 'Manager One',
    email: 'manager@example.com',
    role: 'manager',
    active: true,
  ),
  AdminUserItem(
    name: 'Supporter One',
    email: 'supporter@example.com',
    role: 'supporter',
    active: false,
  ),
];

const adminInvitations = [
  AdminInvitationItem(
    email: 'new-worker@example.com',
    role: 'worker',
    status: 'pending',
    expiresAt: '2026/07/14',
  ),
];

const adminAssignments = [
  AdminAssignmentItem(
    worker: 'Worker One',
    manager: 'Manager One',
    supporter: 'Supporter One',
    active: true,
  ),
];

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ホウレンチェック'),
      ),
      body: const SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                '通知モード新規登録',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12),
              Text(
                'まずは自分だけで通知を使えます。',
                style: TextStyle(fontSize: 16, height: 1.6),
              ),
              SizedBox(height: 24),
              _RegistrationForm(),
              SizedBox(height: 24),
              _InitialNotificationPreview(),
            ],
          ),
        ),
      ),
    );
  }
}

class _RegistrationForm extends StatelessWidget {
  const _RegistrationForm();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const TextField(
          decoration: InputDecoration(
            labelText: '名前',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        const TextField(
          decoration: InputDecoration(
            labelText: 'メールアドレス',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        const TextField(
          decoration: InputDecoration(
            labelText: 'パスワード',
            border: OutlineInputBorder(),
          ),
          obscureText: true,
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.person_add_alt_1),
          label: const Text('登録する'),
        ),
        TextButton(
          onPressed: () {},
          child: const Text('ログインはこちら'),
        ),
      ],
    );
  }
}

class _InitialNotificationPreview extends StatelessWidget {
  const _InitialNotificationPreview();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '登録後の流れ',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 12),
        _StatusTile(label: '通知許可', value: '後で設定することもできます'),
        _StatusTile(label: '初期通知確認', value: 'AM/PM 4種を確認します'),
        _StatusTile(label: '通知モードホーム', value: '今日の通知を確認できます'),
      ],
    );
  }
}

class NotificationHomePage extends StatelessWidget {
  const NotificationHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('通知モードホーム'),
        actions: [
          IconButton(
            tooltip: '設定',
            onPressed: () => Navigator.pushNamed(context, '/notification/settings'),
            icon: const Icon(Icons.settings),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _SectionTitle('次の通知'),
            _NotificationCard(
              title: amPmSchedules.first.title,
              meta: '${amPmSchedules.first.time} / ${amPmSchedules.first.weekdays}',
              actions: const [
                _CompactAction(label: 'スヌーズ', icon: Icons.snooze),
                _CompactAction(label: 'キャンセル', icon: Icons.cancel_outlined),
              ],
            ),
            const SizedBox(height: 20),
            const _SectionTitle('今日の通知'),
            for (final schedule in amPmSchedules) ...[
              _NotificationCard(
                title: schedule.title,
                meta: '${schedule.time} / ${schedule.type}',
              ),
              const SizedBox(height: 8),
            ],
            const SizedBox(height: 12),
            const _PrimaryNavigationButton(
              label: 'CUSTOM通知を作成',
              icon: Icons.add_alert,
              routeName: '/notification/schedules/custom/new',
            ),
            const _PrimaryNavigationButton(
              label: '通知スケジュール',
              icon: Icons.event_note,
              routeName: '/notification/schedules',
            ),
            const _PrimaryNavigationButton(
              label: '通知履歴',
              icon: Icons.history,
              routeName: '/notification/logs',
            ),
            const SizedBox(height: 12),
            const _ModeSwitchPanel(),
          ],
        ),
      ),
    );
  }
}

class NotificationSchedulesPage extends StatelessWidget {
  const NotificationSchedulesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('通知スケジュール'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'AM/PM通知'),
              Tab(text: 'CUSTOM通知'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            ListView(
              padding: const EdgeInsets.all(20),
              children: [
                for (final schedule in amPmSchedules)
                  _ScheduleTile(
                    schedule: schedule,
                    onTap: () => Navigator.pushNamed(
                      context,
                      '/notification/schedules/am-pm/${schedule.id}',
                    ),
                  ),
              ],
            ),
            ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const _PrimaryNavigationButton(
                  label: 'CUSTOM通知を作成',
                  icon: Icons.add_alert,
                  routeName: '/notification/schedules/custom/new',
                ),
                const SizedBox(height: 12),
                for (final schedule in customSchedules)
                  _ScheduleTile(
                    schedule: schedule,
                    onTap: () => Navigator.pushNamed(
                      context,
                      '/notification/schedules/custom/${schedule.id}',
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class AmPmScheduleEditPage extends StatelessWidget {
  const AmPmScheduleEditPage({
    super.key,
    required this.scheduleId,
  });

  final String scheduleId;

  @override
  Widget build(BuildContext context) {
    final schedule = amPmSchedules.firstWhere(
      (item) => item.id == scheduleId,
      orElse: () => amPmSchedules.first,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('AM/PM通知編集'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              schedule.title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextFormField(
              initialValue: schedule.time,
              decoration: const InputDecoration(
                labelText: '時刻',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: schedule.weekdays,
              decoration: const InputDecoration(
                labelText: '曜日',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              value: schedule.enabled,
              onChanged: (_) {},
              title: const Text('有効'),
            ),
            const ListTile(
              leading: Icon(Icons.lock_outline),
              title: Text('タイトルと種別は固定です'),
              subtitle: Text('削除はできません'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.save),
              label: const Text('保存'),
            ),
          ],
        ),
      ),
    );
  }
}

class CustomScheduleEditPage extends StatelessWidget {
  const CustomScheduleEditPage({
    super.key,
    this.scheduleId,
  });

  final String? scheduleId;

  @override
  Widget build(BuildContext context) {
    final schedule = customSchedules.firstWhere(
      (item) => item.id == scheduleId,
      orElse: () => customSchedules.first,
    );
    final isNew = scheduleId == null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isNew ? 'CUSTOM通知作成' : 'CUSTOM通知編集'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            TextFormField(
              initialValue: isNew ? '' : schedule.title,
              decoration: const InputDecoration(
                labelText: 'タイトル',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: isNew ? '10:00' : schedule.time,
              decoration: const InputDecoration(
                labelText: '時刻',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: isNew ? '月 火 水 木 金' : schedule.weekdays,
              decoration: const InputDecoration(
                labelText: '曜日',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: '5',
              decoration: const InputDecoration(
                labelText: 'スヌーズ',
                suffixText: '分',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/notification/schedules'),
              icon: const Icon(Icons.save),
              label: const Text('保存'),
            ),
            if (!isNew)
              OutlinedButton.icon(
                onPressed: () => Navigator.pushNamed(context, '/notification/schedules'),
                icon: const Icon(Icons.delete_outline),
                label: const Text('削除'),
              ),
          ],
        ),
      ),
    );
  }
}

class NotificationLogsPage extends StatelessWidget {
  const NotificationLogsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('通知履歴'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Card(
              child: ListTile(
                leading: Icon(Icons.info_outline),
                title: Text('この履歴は通知の送信履歴です。実際に報告したかどうかを記録するものではありません。'),
              ),
            ),
            const SizedBox(height: 12),
            for (final log in notificationLogs)
              Card(
                child: ListTile(
                  title: Text(log.title),
                  subtitle: Text('${log.sentAt} / ${log.type} / ${log.channel}'),
                  trailing: Text(log.status),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class NotificationSettingsPage extends StatelessWidget {
  const NotificationSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('設定'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            SwitchListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('Push通知'),
            ),
            SwitchListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('メールフォールバック'),
            ),
            SwitchListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('通知音'),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: 'フォールバックメール',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AdminUsersPage extends StatelessWidget {
  const AdminUsersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ユーザー管理'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _AdminNavigationRow(),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/admin/invitations'),
              icon: const Icon(Icons.person_add_alt_1),
              label: const Text('ユーザーを招待'),
            ),
            const SizedBox(height: 12),
            for (final user in adminUsers)
              Card(
                child: ListTile(
                  leading: Icon(user.active ? Icons.check_circle_outline : Icons.pause_circle_outline),
                  title: Text(user.name),
                  subtitle: Text('${user.email} / ${user.role}'),
                  trailing: Text(user.active ? '有効' : '停止中'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class AdminInvitationsPage extends StatelessWidget {
  const AdminInvitationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('招待管理'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _AdminNavigationRow(),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '招待メールアドレス',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: 'worker',
              items: const [
                DropdownMenuItem(value: 'worker', child: Text('worker')),
                DropdownMenuItem(value: 'manager', child: Text('manager')),
                DropdownMenuItem(value: 'supporter', child: Text('supporter')),
              ],
              onChanged: (_) {},
              decoration: const InputDecoration(
                labelText: 'ロール',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.send),
              label: const Text('招待を送信'),
            ),
            const SizedBox(height: 20),
            const _SectionTitle('招待一覧'),
            for (final invitation in adminInvitations)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.mark_email_unread_outlined),
                  title: Text(invitation.email),
                  subtitle: Text('${invitation.role} / ${invitation.expiresAt}まで'),
                  trailing: Text(invitation.status),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class AdminRolesPage extends StatelessWidget {
  const AdminRolesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ロール管理'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _AdminNavigationRow(),
            const SizedBox(height: 12),
            for (final user in adminUsers)
              Card(
                child: ListTile(
                  title: Text(user.name),
                  subtitle: Text(user.email),
                  trailing: DropdownButton<String>(
                    value: user.role,
                    items: const [
                      DropdownMenuItem(value: 'worker', child: Text('worker')),
                      DropdownMenuItem(value: 'manager', child: Text('manager')),
                      DropdownMenuItem(value: 'supporter', child: Text('supporter')),
                    ],
                    onChanged: (_) {},
                  ),
                ),
              ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.history_edu),
                title: Text('ロール変更は監査ログに保存されます'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AdminAssignmentsPage extends StatelessWidget {
  const AdminAssignmentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('担当者紐づけ'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _AdminNavigationRow(),
            const SizedBox(height: 12),
            for (final assignment in adminAssignments)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.group_add),
                  title: Text(assignment.worker),
                  subtitle: Text('manager: ${assignment.manager}\nsupporter: ${assignment.supporter}'),
                  trailing: Text(assignment.active ? '有効' : '解除済み'),
                ),
              ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.link_off),
              label: const Text('担当解除'),
            ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.info_outline),
                title: Text('担当解除時は物理削除せず active=false として保存します'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class WorkerTodayReportPage extends StatelessWidget {
  const WorkerTodayReportPage({
    super.key,
    required this.eventId,
  });

  final String eventId;

  @override
  Widget build(BuildContext context) {
    const generatedText = '''
おはようございます。
これから午前の作業を開始します。
本日は在庫確認に取り組みます。
相談したいこと：優先順位を相談したいです
補足：午後に確認します''';

    return Scaffold(
      appBar: AppBar(
        title: const Text('AM_START報告'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: '対象イベント', value: eventId),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '今日やること',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '相談事項',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '自由入力',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 20),
            const _SectionTitle('生成文確認'),
            const TextField(
              decoration: InputDecoration(
                border: OutlineInputBorder(),
              ),
              maxLines: 6,
            ),
            const SizedBox(height: 8),
            const Text(generatedText),
            const SizedBox(height: 20),
            const _SectionTitle('送信先確認'),
            CheckboxListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('Supporter One'),
              subtitle: const Text('supporter@example.com'),
            ),
            CheckboxListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('Manager One'),
              subtitle: const Text('manager@example.com'),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.send),
              label: const Text('送信する'),
            ),
            const SizedBox(height: 20),
            const _SectionTitle('送信完了'),
            const _StatusTile(label: 'reportEvents.status', value: 'reported'),
            const _StatusTile(label: 'delivery', value: 'manager@example.com failed'),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.refresh),
              label: const Text('再送'),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.title,
    required this.meta,
    this.actions = const [],
  });

  final String title;
  final String meta;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(meta),
            if (actions.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: actions,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AdminNavigationRow extends StatelessWidget {
  const _AdminNavigationRow();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        OutlinedButton.icon(
          onPressed: () => Navigator.pushNamed(context, '/admin/users'),
          icon: const Icon(Icons.people_outline),
          label: const Text('ユーザー管理'),
        ),
        OutlinedButton.icon(
          onPressed: () => Navigator.pushNamed(context, '/admin/invitations'),
          icon: const Icon(Icons.mail_outline),
          label: const Text('招待管理'),
        ),
        OutlinedButton.icon(
          onPressed: () => Navigator.pushNamed(context, '/admin/roles'),
          icon: const Icon(Icons.admin_panel_settings_outlined),
          label: const Text('ロール管理'),
        ),
        OutlinedButton.icon(
          onPressed: () => Navigator.pushNamed(context, '/admin/assignments'),
          icon: const Icon(Icons.account_tree_outlined),
          label: const Text('担当者紐づけ'),
        ),
      ],
    );
  }
}

class _ScheduleTile extends StatelessWidget {
  const _ScheduleTile({
    required this.schedule,
    required this.onTap,
  });

  final NotificationSchedule schedule;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: Icon(schedule.isCustom ? Icons.notifications_active : Icons.schedule),
        title: Text(schedule.title),
        subtitle: Text('${schedule.time} / ${schedule.weekdays}'),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}

class _PrimaryNavigationButton extends StatelessWidget {
  const _PrimaryNavigationButton({
    required this.label,
    required this.icon,
    required this.routeName,
  });

  final String label;
  final IconData icon;
  final String routeName;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: FilledButton.icon(
        onPressed: () => Navigator.pushNamed(context, routeName),
        icon: Icon(icon),
        label: Text(label),
      ),
    );
  }
}

class _CompactAction extends StatelessWidget {
  const _CompactAction({
    required this.label,
    required this.icon,
  });

  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () {},
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

class _ModeSwitchPanel extends StatelessWidget {
  const _ModeSwitchPanel();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '報告支援モード',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            const Text('支援員や上司と報告を共有したい場合は、報告支援モードへ切り替えできます。'),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.sync_alt),
              label: const Text('報告支援モードへ切り替え'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: Theme.of(context).textTheme.titleLarge,
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
