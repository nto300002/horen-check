import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const ProviderScope(child: HorenCheckApp()));
}

final ValueNotifier<String?> signedInUserName = ValueNotifier<String?>(null);

class HorenCheckApp extends StatelessWidget {
  const HorenCheckApp({
    super.key,
    this.initialRoute = '/',
    this.registrationClient,
  });

  final String initialRoute;
  final RegistrationClient? registrationClient;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ホウレンチェック',
      initialRoute: initialRoute,
      onGenerateRoute: (settings) => _buildRoute(
        settings,
        registrationClient ?? const HttpRegistrationClient(),
      ),
      onGenerateInitialRoutes: (initialRoute) => [
        _buildRoute(
          RouteSettings(name: initialRoute),
          registrationClient ?? const HttpRegistrationClient(),
        ),
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

abstract class RegistrationClient {
  Future<void> registerNotificationMode({
    required String name,
    required String email,
    required String password,
  });
}

class HttpRegistrationClient implements RegistrationClient {
  const HttpRegistrationClient({
    this.apiBaseUrl = 'http://127.0.0.1:5001',
  });

  final String apiBaseUrl;

  @override
  Future<void> registerNotificationMode({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$apiBaseUrl/api/notification-users'),
      headers: const {
        'content-type': 'application/json',
      },
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('registration failed: ${response.statusCode}');
    }
  }
}

Route<void> _buildRoute(
  RouteSettings settings,
  RegistrationClient registrationClient,
) {
  final name = settings.name ?? '/';

  if (name == '/') {
    return _pageRoute(
        settings, RegisterPage(registrationClient: registrationClient));
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
  if (name == '/notification/mode-switch') {
    return _pageRoute(settings, const ModeSwitchRequestPage());
  }
  if (name == '/notification/mode-switch/pending') {
    return _pageRoute(settings, const ModeSwitchPendingPage());
  }
  if (name == '/notification/mode-switch/rejected') {
    return _pageRoute(settings, const ModeSwitchRejectedPage());
  }
  if (name == '/admin/users') {
    return _pageRoute(settings, const AdminUsersPage());
  }
  if (name.startsWith('/admin/users/')) {
    final userId = name.split('/').last;
    return _pageRoute(settings, AdminUserDetailPage(userId: userId));
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
  if (name == '/admin/audit-logs') {
    return _pageRoute(settings, const AdminAuditLogsPage());
  }
  if (name == '/admin/mode-switch-requests') {
    return _pageRoute(settings, const AdminModeSwitchRequestsPage());
  }
  if (name == '/admin/employment-transitions') {
    return _pageRoute(
        settings, const EmploymentTransitionsPage(actorRole: 'admin'));
  }
  if (name.startsWith('/admin/employment-transitions/')) {
    final transitionId = name.split('/').last;
    return _pageRoute(
        settings,
        EmploymentTransitionDetailPage(
          transitionId: transitionId,
          actorRole: 'admin',
        ));
  }
  if (name.startsWith('/admin/mode-switch-requests/')) {
    final requestId = name.split('/').last;
    return _pageRoute(
        settings,
        ModeSwitchRequestDetailPage(
          requestId: requestId,
          actorRole: 'admin',
        ));
  }
  if (name.startsWith('/admin/reports/')) {
    final reportId = name.split('/').last;
    return _pageRoute(settings, AdminReportBodyPage(reportId: reportId));
  }
  if (name == '/manager/home') {
    return _pageRoute(settings, const ManagerHomePage());
  }
  if (name == '/manager/workers') {
    return _pageRoute(settings, const ManagerWorkersPage());
  }
  if (name == '/manager/consultations') {
    return _pageRoute(
        settings, const ConsultationThreadsPage(actorRole: 'manager'));
  }
  if (name.startsWith('/manager/consultations/')) {
    final threadId = name.split('/').last;
    return _pageRoute(
        settings,
        ConsultationThreadDetailPage(
          threadId: threadId,
          actorRole: 'manager',
        ));
  }
  if (name.startsWith('/manager/reports/')) {
    final reportId = name.split('/').last;
    return _pageRoute(settings, ManagerReportDetailPage(reportId: reportId));
  }
  if (name == '/supporter/home') {
    return _pageRoute(settings, const SupporterHomePage());
  }
  if (name == '/supporter/workers') {
    return _pageRoute(settings, const SupporterWorkersPage());
  }
  if (name == '/supporter/mode-switch-requests') {
    return _pageRoute(settings, const SupporterModeSwitchRequestsPage());
  }
  if (name == '/supporter/employment-transitions') {
    return _pageRoute(
        settings, const EmploymentTransitionsPage(actorRole: 'supporter'));
  }
  if (name.startsWith('/supporter/employment-transitions/')) {
    final transitionId = name.split('/').last;
    return _pageRoute(
        settings,
        EmploymentTransitionDetailPage(
          transitionId: transitionId,
          actorRole: 'supporter',
        ));
  }
  if (name == '/supporter/consultations') {
    return _pageRoute(
        settings, const ConsultationThreadsPage(actorRole: 'supporter'));
  }
  if (name.startsWith('/supporter/consultations/')) {
    final threadId = name.split('/').last;
    return _pageRoute(
        settings,
        ConsultationThreadDetailPage(
          threadId: threadId,
          actorRole: 'supporter',
        ));
  }
  if (name.startsWith('/supporter/mode-switch-requests/')) {
    final requestId = name.split('/').last;
    return _pageRoute(
        settings,
        ModeSwitchRequestDetailPage(
          requestId: requestId,
          actorRole: 'supporter',
        ));
  }
  if (name.startsWith('/supporter/workers/')) {
    final workerId = name.split('/').last;
    return _pageRoute(settings, SupporterWorkerDetailPage(workerId: workerId));
  }
  if (name.startsWith('/supporter/reports/')) {
    final reportId = name.split('/').last;
    return _pageRoute(settings, SupporterReportDetailPage(reportId: reportId));
  }
  if (name == '/worker/consultations') {
    return _pageRoute(
        settings, const ConsultationThreadsPage(actorRole: 'worker'));
  }
  if (name.startsWith('/worker/consultations/')) {
    final threadId = name.split('/').last;
    return _pageRoute(
        settings,
        ConsultationThreadDetailPage(
          threadId: threadId,
          actorRole: 'worker',
        ));
  }
  if (name == '/worker/employment-transition/request') {
    return _pageRoute(settings, const WorkerEmploymentTransitionRequestPage());
  }
  if (name == '/worker/employment-transition/pending') {
    return _pageRoute(settings, const WorkerEmploymentTransitionPendingPage());
  }
  if (name == '/worker/reports') {
    return _pageRoute(settings, const WorkerReportsPage());
  }
  if (name.startsWith('/worker/reports/') && name.endsWith('/correction')) {
    final parts = name.split('/');
    return _pageRoute(settings, WorkerReportCorrectionPage(reportId: parts[3]));
  }
  if (name.startsWith('/worker/reports/')) {
    final reportId = name.split('/').last;
    return _pageRoute(settings, WorkerReportDetailPage(reportId: reportId));
  }
  if (name.startsWith('/worker/today/report/')) {
    final eventId = name.split('/').last;
    return _pageRoute(settings, WorkerTodayReportPage(eventId: eventId));
  }
  if (name == '/legal/privacy') {
    return _pageRoute(settings, const PrivacyPolicyPage());
  }
  if (name == '/legal/terms') {
    return _pageRoute(settings, const TermsOfServicePage());
  }

  return _pageRoute(settings, const NotificationHomePage());
}

MaterialPageRoute<void> _pageRoute(RouteSettings settings, Widget page) {
  return MaterialPageRoute<void>(
    settings: settings,
    builder: (_) => page,
  );
}

PreferredSizeWidget _commonAppBar(
  BuildContext context, {
  required String title,
  List<BreadcrumbItem> breadcrumbs = const [],
  List<Widget> actions = const [],
  PreferredSizeWidget? bottom,
}) {
  return AppBar(
    toolbarHeight: breadcrumbs.isEmpty ? 72 : 88,
    automaticallyImplyLeading: true,
    centerTitle: false,
    titleSpacing: 16,
    title: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ValueListenableBuilder<String?>(
              valueListenable: signedInUserName,
              builder: (context, userName, _) {
                return Text(
                  'アカウント: ${currentAccountName(context, userName)}',
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                );
              },
            ),
            const SizedBox(width: 8),
            TextButton(
              onPressed: () {
                signedInUserName.value = null;
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/',
                  (route) => false,
                );
              },
              child: const Text('ログアウト'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (breadcrumbs.isNotEmpty) ...[
          _BreadcrumbTrail(items: breadcrumbs),
          const SizedBox(height: 4),
        ],
        Text(title),
      ],
    ),
    actions: actions,
    bottom: bottom,
  );
}

PreferredSizeWidget _breadcrumbAppBar(
  BuildContext context, {
  required String title,
  required List<BreadcrumbItem> breadcrumbs,
}) {
  return _commonAppBar(
    context,
    title: title,
    breadcrumbs: breadcrumbs,
  );
}

String currentAccountName(BuildContext context, String? signedInName) {
  if (signedInName != null && signedInName.trim().isNotEmpty) {
    return signedInName.trim();
  }

  final routeName = ModalRoute.of(context)?.settings.name ?? '';
  if (routeName == '/') {
    return 'ゲスト';
  }
  if (routeName.startsWith('/admin')) {
    return 'Admin One';
  }
  if (routeName.startsWith('/manager')) {
    return 'Manager One';
  }
  if (routeName.startsWith('/supporter')) {
    return 'Supporter One';
  }
  return 'Worker One';
}

class BreadcrumbItem {
  const BreadcrumbItem({
    required this.label,
    this.routeName,
  });

  final String label;
  final String? routeName;
}

class _BreadcrumbTrail extends StatelessWidget {
  const _BreadcrumbTrail({
    required this.items,
  });

  final List<BreadcrumbItem> items;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textStyle = Theme.of(context).textTheme.bodySmall;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var index = 0; index < items.length; index++) ...[
            _BreadcrumbSegment(
              item: items[index],
              style: textStyle,
            ),
            if (index < items.length - 1)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Text(
                  '>',
                  style: textStyle?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _BreadcrumbSegment extends StatefulWidget {
  const _BreadcrumbSegment({
    required this.item,
    required this.style,
  });

  final BreadcrumbItem item;
  final TextStyle? style;

  @override
  State<_BreadcrumbSegment> createState() => _BreadcrumbSegmentState();
}

class _BreadcrumbSegmentState extends State<_BreadcrumbSegment> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final routeName = widget.item.routeName;
    final text = Text(
      widget.item.label,
      overflow: TextOverflow.ellipsis,
      style: widget.style?.copyWith(
        color: routeName == null
            ? colorScheme.onSurfaceVariant
            : colorScheme.primary,
      ),
    );

    if (routeName == null) {
      return text;
    }

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() {
        _isHovered = true;
      }),
      onExit: (_) => setState(() {
        _isHovered = false;
      }),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => Navigator.pushNamedAndRemoveUntil(
          context,
          routeName,
          routeName == '/notification/home'
              ? (route) => false
              : (route) => true,
        ),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
          decoration: BoxDecoration(
            color: _isHovered
                ? colorScheme.primary.withValues(alpha: 0.12)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(4),
          ),
          child: text,
        ),
      ),
    );
  }
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
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.active,
  });

  final String id;
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

class ReviewReportItem {
  const ReviewReportItem({
    required this.id,
    required this.workerId,
    required this.workerName,
    required this.type,
    required this.submittedAt,
    required this.status,
    required this.body,
    required this.hasConsultation,
  });

  final String id;
  final String workerId;
  final String workerName;
  final String type;
  final String submittedAt;
  final String status;
  final String body;
  final bool hasConsultation;
}

class ConsultationThreadItem {
  const ConsultationThreadItem({
    required this.id,
    required this.reportId,
    required this.workerName,
    required this.type,
    required this.status,
    required this.lastMessage,
    required this.reply,
  });

  final String id;
  final String reportId;
  final String workerName;
  final String type;
  final String status;
  final String lastMessage;
  final String reply;
}

class SupporterWorkerItem {
  const SupporterWorkerItem({
    required this.id,
    required this.name,
    required this.lastReportAt,
  });

  final String id;
  final String name;
  final String lastReportAt;
}

class AuditLogItem {
  const AuditLogItem({
    required this.action,
    required this.actor,
    required this.target,
    required this.reason,
    required this.createdAt,
  });

  final String action;
  final String actor;
  final String target;
  final String reason;
  final String createdAt;
}

class ModeSwitchRequestItem {
  const ModeSwitchRequestItem({
    required this.id,
    required this.workerName,
    required this.supporterEmail,
    required this.employmentContext,
    required this.message,
    required this.status,
    required this.reviewComment,
  });

  final String id;
  final String workerName;
  final String supporterEmail;
  final String employmentContext;
  final String message;
  final String status;
  final String reviewComment;
}

class EmploymentTransitionItem {
  const EmploymentTransitionItem({
    required this.id,
    required this.workerName,
    required this.fromContext,
    required this.toContext,
    required this.status,
    required this.transitionRecipientPolicy,
    required this.oldManagerId,
    required this.newManagerId,
    required this.oldSupporterId,
    required this.newSupporterId,
  });

  final String id;
  final String workerName;
  final String fromContext;
  final String toContext;
  final String status;
  final String transitionRecipientPolicy;
  final String oldManagerId;
  final String newManagerId;
  final String oldSupporterId;
  final String newSupporterId;
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
    id: 'worker-1',
    name: 'Worker One',
    email: 'worker@example.com',
    role: 'worker',
    active: true,
  ),
  AdminUserItem(
    id: 'manager-1',
    name: 'Manager One',
    email: 'manager@example.com',
    role: 'manager',
    active: true,
  ),
  AdminUserItem(
    id: 'supporter-1',
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

const reviewReports = [
  ReviewReportItem(
    id: 'report-1',
    workerId: 'worker-1',
    workerName: 'Worker One',
    type: 'AM_START',
    submittedAt: '2026/07/07 09:05',
    status: 'consultation',
    body: 'おはようございます。午前は在庫確認を進めます。優先順位について相談があります。',
    hasConsultation: true,
  ),
];

const consultationThreads = [
  ConsultationThreadItem(
    id: 'report-1',
    reportId: 'report-1',
    workerName: 'Worker One',
    type: 'AM_START',
    status: 'open',
    lastMessage: '優先順位について相談があります。',
    reply: '午後は商品登録から進めましょう',
  ),
];

const supporterWorkers = [
  SupporterWorkerItem(
    id: 'worker-1',
    name: 'Worker One',
    lastReportAt: '2026/07/07 09:05',
  ),
];

const auditLogs = [
  AuditLogItem(
    action: 'report_viewed',
    actor: 'admin-1',
    target: 'report-1',
    reason: '支援記録確認',
    createdAt: '2026/07/07 10:00',
  ),
  AuditLogItem(
    action: 'assign_user',
    actor: 'admin-1',
    target: 'worker-1',
    reason: '担当者設定',
    createdAt: '2026/07/07 09:00',
  ),
];

const modeSwitchRequests = [
  ModeSwitchRequestItem(
    id: 'switch-1',
    workerName: 'Worker One',
    supporterEmail: 'supporter@example.com',
    employmentContext: 'supported_facility',
    message: '報告支援を使いたいです',
    status: 'pending',
    reviewComment: '',
  ),
  ModeSwitchRequestItem(
    id: 'switch-rejected',
    workerName: 'Worker Two',
    supporterEmail: 'supporter@example.com',
    employmentContext: 'general_employment',
    message: '一般就労先で報告を安定させたいです',
    status: 'rejected',
    reviewComment: '担当者確認後に再申請してください',
  ),
];

const employmentTransitions = [
  EmploymentTransitionItem(
    id: 'transition-1',
    workerName: 'Worker One',
    fromContext: 'supported_facility',
    toContext: 'general_employment',
    status: 'active',
    transitionRecipientPolicy: 'manager_and_supporter',
    oldManagerId: 'old-manager-1',
    newManagerId: 'new-manager-1',
    oldSupporterId: 'old-supporter-1',
    newSupporterId: 'new-supporter-1',
  ),
];

String employmentContextLabel(String value) {
  return switch (value) {
    'supported_facility' => '福祉施設内就労',
    'general_employment' => '一般就労',
    _ => value,
  };
}

String requestStatusLabel(String value) {
  return switch (value) {
    'pending' => '申請中',
    'approved' => '承認済み',
    'rejected' => '却下',
    'active' => '進行中',
    'completed' => '完了',
    'cancelled' => 'キャンセル',
    _ => value,
  };
}

class RegisterPage extends StatelessWidget {
  const RegisterPage({
    super.key,
    required this.registrationClient,
  });

  final RegistrationClient registrationClient;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: 'ホウレンチェック'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                '通知モード新規登録',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'まずは自分だけで通知を使えます。',
                style: TextStyle(fontSize: 16, height: 1.6),
              ),
              const SizedBox(height: 24),
              _RegistrationForm(registrationClient: registrationClient),
              const SizedBox(height: 24),
              const _InitialNotificationPreview(),
            ],
          ),
        ),
      ),
    );
  }
}

class _RegistrationForm extends StatefulWidget {
  const _RegistrationForm({
    required this.registrationClient,
  });

  final RegistrationClient registrationClient;

  @override
  State<_RegistrationForm> createState() => _RegistrationFormState();
}

class _RegistrationFormState extends State<_RegistrationForm> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = '名前、メールアドレス、パスワードを入力してください。';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await widget.registrationClient.registerNotificationMode(
        name: name,
        email: email,
        password: password,
      );
      signedInUserName.value = name;
      if (!mounted) {
        return;
      }
      Navigator.pushReplacementNamed(context, '/notification/home');
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = '登録に失敗しました。APIサーバーの起動状態を確認してください。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: '名前',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _emailController,
          decoration: const InputDecoration(
            labelText: 'メールアドレス',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          decoration: const InputDecoration(
            labelText: 'パスワード',
            border: OutlineInputBorder(),
          ),
          obscureText: true,
        ),
        const SizedBox(height: 16),
        if (_errorMessage != null) ...[
          Text(
            _errorMessage!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
          const SizedBox(height: 12),
        ],
        FilledButton.icon(
          onPressed: _isSubmitting ? null : _submit,
          icon: const Icon(Icons.person_add_alt_1),
          label: Text(_isSubmitting ? '登録中' : '登録する'),
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
      appBar: _commonAppBar(
        context,
        title: '通知モードホーム',
        actions: [
          IconButton(
            tooltip: '設定',
            onPressed: () =>
                Navigator.pushNamed(context, '/notification/settings'),
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
              meta:
                  '${amPmSchedules.first.time} / ${amPmSchedules.first.weekdays}',
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
        appBar: _commonAppBar(
          context,
          title: '通知スケジュール',
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
      appBar: _commonAppBar(context, title: 'AM/PM通知編集'),
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
      appBar:
          _commonAppBar(context, title: isNew ? 'CUSTOM通知作成' : 'CUSTOM通知編集'),
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
              onPressed: () =>
                  Navigator.pushNamed(context, '/notification/schedules'),
              icon: const Icon(Icons.save),
              label: const Text('保存'),
            ),
            if (!isNew)
              OutlinedButton.icon(
                onPressed: () =>
                    Navigator.pushNamed(context, '/notification/schedules'),
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
      appBar: _commonAppBar(context, title: '通知履歴'),
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
                  subtitle:
                      Text('${log.sentAt} / ${log.type} / ${log.channel}'),
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
      appBar: _commonAppBar(context, title: '設定'),
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
            const SizedBox(height: 12),
            const _PrimaryNavigationButton(
              label: '報告支援モードへ切り替え',
              icon: Icons.sync_alt,
              routeName: '/notification/mode-switch',
            ),
          ],
        ),
      ),
    );
  }
}

class ModeSwitchRequestPage extends StatelessWidget {
  const ModeSwitchRequestPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _breadcrumbAppBar(
        context,
        title: '報告支援モード切り替え申請',
        breadcrumbs: const [
          BreadcrumbItem(label: '通知モードホーム', routeName: '/notification/home'),
          BreadcrumbItem(label: '報告支援モード切り替え申請'),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const TextField(
              decoration: InputDecoration(
                labelText: '支援員メールアドレス',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: 'supported_facility',
              items: const [
                DropdownMenuItem(
                    value: 'supported_facility', child: Text('福祉施設内就労')),
                DropdownMenuItem(
                    value: 'general_employment', child: Text('一般就労')),
              ],
              onChanged: (_) {},
              decoration: const InputDecoration(
                labelText: '希望する就労状況',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: 'メッセージ',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('AM/PM通知を報告スケジュールへ移行'),
            ),
            FilledButton.icon(
              onPressed: () => Navigator.pushNamed(
                  context, '/notification/mode-switch/pending'),
              icon: const Icon(Icons.send),
              label: const Text('申請する'),
            ),
          ],
        ),
      ),
    );
  }
}

class ModeSwitchPendingPage extends StatelessWidget {
  const ModeSwitchPendingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _breadcrumbAppBar(
        context,
        title: '切り替え申請中',
        breadcrumbs: const [
          BreadcrumbItem(label: '通知モードホーム', routeName: '/notification/home'),
          BreadcrumbItem(
              label: '報告支援モード切り替え申請', routeName: '/notification/mode-switch'),
          BreadcrumbItem(label: '申請中'),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _StatusTile(label: '申請状態', value: '申請中'),
            const Card(
              child: ListTile(
                leading: Icon(Icons.lock_clock),
                title: Text('申請中は新規申請できません'),
              ),
            ),
            OutlinedButton.icon(
              onPressed: () =>
                  Navigator.pushNamed(context, '/notification/mode-switch'),
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('申請を取り消して再申請'),
            ),
          ],
        ),
      ),
    );
  }
}

class ModeSwitchRejectedPage extends StatelessWidget {
  const ModeSwitchRejectedPage({super.key});

  @override
  Widget build(BuildContext context) {
    final rejected = modeSwitchRequests.last;
    return Scaffold(
      appBar: _breadcrumbAppBar(
        context,
        title: '切り替え申請却下',
        breadcrumbs: const [
          BreadcrumbItem(label: '通知モードホーム', routeName: '/notification/home'),
          BreadcrumbItem(
              label: '報告支援モード切り替え申請', routeName: '/notification/mode-switch'),
          BreadcrumbItem(label: '却下'),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: '却下理由', value: rejected.reviewComment),
            FilledButton.icon(
              onPressed: () =>
                  Navigator.pushNamed(context, '/notification/mode-switch'),
              icon: const Icon(Icons.refresh),
              label: const Text('再申請する'),
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
      appBar: _commonAppBar(context, title: 'ユーザー管理'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _AdminNavigationRow(),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () =>
                  Navigator.pushNamed(context, '/admin/invitations'),
              icon: const Icon(Icons.person_add_alt_1),
              label: const Text('ユーザーを招待'),
            ),
            const SizedBox(height: 12),
            for (final user in adminUsers)
              Card(
                child: ListTile(
                  onTap: () =>
                      Navigator.pushNamed(context, '/admin/users/${user.id}'),
                  leading: Icon(user.active
                      ? Icons.check_circle_outline
                      : Icons.pause_circle_outline),
                  title: Text(user.name),
                  subtitle: Text(
                      '${user.email} / ${user.role} / ${user.active ? '有効' : '停止中'}'),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class AdminUserDetailPage extends StatelessWidget {
  const AdminUserDetailPage({
    super.key,
    required this.userId,
  });

  final String userId;

  @override
  Widget build(BuildContext context) {
    final user = adminUsers.firstWhere(
      (item) => item.id == userId,
      orElse: () => adminUsers.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: 'ユーザー詳細'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'userId', value: user.id),
            _StatusTile(label: 'name', value: user.name),
            _StatusTile(label: 'email', value: user.email),
            _StatusTile(label: 'role', value: user.role),
            _StatusTile(label: 'active', value: user.active ? 'true' : 'false'),
            const SizedBox(height: 12),
            const _AdminNavigationRow(),
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
      appBar: _commonAppBar(context, title: '招待管理'),
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
                  subtitle:
                      Text('${invitation.role} / ${invitation.expiresAt}まで'),
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
      appBar: _commonAppBar(context, title: 'ロール管理'),
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
                      DropdownMenuItem(
                          value: 'manager', child: Text('manager')),
                      DropdownMenuItem(
                          value: 'supporter', child: Text('supporter')),
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
      appBar: _commonAppBar(context, title: '担当者紐づけ'),
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
                  subtitle: Text(
                      'manager: ${assignment.manager}\nsupporter: ${assignment.supporter}'),
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

class AdminAuditLogsPage extends StatelessWidget {
  const AdminAuditLogsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '監査ログ'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _AdminNavigationRow(),
            const SizedBox(height: 12),
            for (final log in auditLogs)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.manage_search),
                  title: Text(log.action),
                  subtitle: Text('${log.actor} / ${log.target}\n${log.reason}'),
                  trailing: Text(log.createdAt),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class AdminReportBodyPage extends StatelessWidget {
  const AdminReportBodyPage({
    super.key,
    required this.reportId,
  });

  final String reportId;

  @override
  Widget build(BuildContext context) {
    final report = reviewReports.firstWhere(
      (item) => item.id == reportId,
      orElse: () => reviewReports.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: '報告本文閲覧'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'reportId', value: report.id),
            const TextField(
              decoration: InputDecoration(
                labelText: '閲覧理由',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.visibility),
              label: const Text('理由を記録して本文を閲覧'),
            ),
            const SizedBox(height: 20),
            const _SectionTitle('報告本文'),
            Text(report.body),
            const SizedBox(height: 12),
            const _StatusTile(
                label: 'auditLogs.action', value: 'report_viewed'),
          ],
        ),
      ),
    );
  }
}

class ManagerHomePage extends StatelessWidget {
  const ManagerHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: 'managerホーム'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _PrimaryNavigationButton(
              label: '担当worker当日一覧',
              icon: Icons.today,
              routeName: '/manager/workers',
            ),
            const SizedBox(height: 12),
            const _SectionTitle('当日報告'),
            const _StatusTile(
              label: '4報告ステータス',
              value:
                  'AM_START reported / AM_END pending / PM_START pending / PM_END pending',
            ),
            const SizedBox(height: 12),
            for (final report in reviewReports)
              _ManagerReportListTile(report: report),
          ],
        ),
      ),
    );
  }
}

class ManagerWorkersPage extends StatelessWidget {
  const ManagerWorkersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '担当worker当日一覧'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final report in reviewReports)
              _ManagerReportListTile(report: report),
            const Card(
              child: ListTile(
                leading: Icon(Icons.lock_outline),
                title: Text('一覧では報告本文を表示しません'),
                subtitle: Text('本文確認は報告詳細で権限確認後に表示します'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ManagerReportDetailPage extends StatelessWidget {
  const ManagerReportDetailPage({
    super.key,
    required this.reportId,
  });

  final String reportId;

  @override
  Widget build(BuildContext context) {
    final report = reviewReports.firstWhere(
      (item) => item.id == reportId,
      orElse: () => reviewReports.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: '当日報告詳細'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'worker', value: report.workerName),
            _StatusTile(label: 'type', value: report.type),
            _StatusTile(label: 'reportStatus', value: report.status),
            const SizedBox(height: 12),
            const _SectionTitle('報告本文'),
            Text(report.body),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.forum_outlined),
              label: const Text('相談返信'),
            ),
          ],
        ),
      ),
    );
  }
}

class SupporterHomePage extends StatelessWidget {
  const SupporterHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: 'supporterホーム'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            _PrimaryNavigationButton(
              label: '担当worker一覧',
              icon: Icons.groups_outlined,
              routeName: '/supporter/workers',
            ),
            _PrimaryNavigationButton(
              label: 'モード切替申請',
              icon: Icons.sync_alt,
              routeName: '/supporter/mode-switch-requests',
            ),
          ],
        ),
      ),
    );
  }
}

class SupporterWorkersPage extends StatelessWidget {
  const SupporterWorkersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '担当worker一覧'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final worker in supporterWorkers)
              Card(
                child: ListTile(
                  onTap: () => Navigator.pushNamed(
                      context, '/supporter/workers/${worker.id}'),
                  leading: const Icon(Icons.person_search),
                  title: Text(worker.name),
                  subtitle: Text('最終報告: ${worker.lastReportAt}'),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class SupporterWorkerDetailPage extends StatelessWidget {
  const SupporterWorkerDetailPage({
    super.key,
    required this.workerId,
  });

  final String workerId;

  @override
  Widget build(BuildContext context) {
    final worker = supporterWorkers.firstWhere(
      (item) => item.id == workerId,
      orElse: () => supporterWorkers.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: 'worker詳細'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'worker', value: worker.name),
            const _StatusTile(label: '表示範囲', value: '過去90日分'),
            const _StatusTile(
              label: '4報告ステータス',
              value:
                  'AM_START reported / AM_END pending / PM_START pending / PM_END pending',
            ),
            const SizedBox(height: 12),
            for (final report in reviewReports)
              Card(
                child: ListTile(
                  onTap: () => Navigator.pushNamed(
                      context, '/supporter/reports/${report.id}'),
                  leading: const Icon(Icons.description_outlined),
                  title: Text('${report.type} / ${report.submittedAt}'),
                  subtitle: Text(report.status),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class SupporterReportDetailPage extends StatelessWidget {
  const SupporterReportDetailPage({
    super.key,
    required this.reportId,
  });

  final String reportId;

  @override
  Widget build(BuildContext context) {
    final report = reviewReports.firstWhere(
      (item) => item.id == reportId,
      orElse: () => reviewReports.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: '報告詳細・相談返信'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'worker', value: report.workerName),
            _StatusTile(label: 'submittedAt', value: report.submittedAt),
            const SizedBox(height: 12),
            const _SectionTitle('報告本文'),
            Text(report.body),
            const SizedBox(height: 20),
            const TextField(
              decoration: InputDecoration(
                labelText: '相談返信',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }
}

class ConsultationThreadsPage extends StatelessWidget {
  const ConsultationThreadsPage({
    super.key,
    required this.actorRole,
  });

  final String actorRole;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '相談スレッド一覧'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final thread in consultationThreads)
              Card(
                child: ListTile(
                  onTap: () => Navigator.pushNamed(
                      context, '/$actorRole/consultations/${thread.id}'),
                  leading: const Icon(Icons.forum_outlined),
                  title: Text(
                      '${thread.status} / ${actorRole == 'worker' ? thread.type : thread.workerName}'),
                  subtitle: Text(thread.lastMessage),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class ConsultationThreadDetailPage extends StatelessWidget {
  const ConsultationThreadDetailPage({
    super.key,
    required this.threadId,
    required this.actorRole,
  });

  final String threadId;
  final String actorRole;

  @override
  Widget build(BuildContext context) {
    final thread = consultationThreads.firstWhere(
      (item) => item.id == threadId,
      orElse: () => consultationThreads.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: '相談スレッド'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'threadStatus', value: thread.status),
            _StatusTile(label: 'actorRole', value: actorRole),
            _StatusTile(
                label: 'report',
                value: '${thread.type} / ${thread.workerName}'),
            const SizedBox(height: 12),
            const _SectionTitle('相談内容'),
            Text(thread.lastMessage),
            const SizedBox(height: 20),
            const _SectionTitle('返信'),
            Text(thread.reply),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '返信本文',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.reply),
              label: const Text('返信する'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('完了にする'),
            ),
          ],
        ),
      ),
    );
  }
}

class WorkerEmploymentTransitionRequestPage extends StatelessWidget {
  const WorkerEmploymentTransitionRequestPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '一般就労移行希望申請'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            DropdownButtonFormField<String>(
              initialValue: 'general_employment',
              items: const [
                DropdownMenuItem(
                    value: 'general_employment', child: Text('一般就労')),
                DropdownMenuItem(
                    value: 'supported_facility', child: Text('福祉施設内就労')),
              ],
              onChanged: (_) {},
              decoration: const InputDecoration(
                labelText: '希望する就労状況',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: 'メッセージ',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.send),
              label: const Text('申請する'),
            ),
          ],
        ),
      ),
    );
  }
}

class WorkerEmploymentTransitionPendingPage extends StatelessWidget {
  const WorkerEmploymentTransitionPendingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '移行申請中'),
      body: const SafeArea(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _StatusTile(label: '申請状態', value: '一般就労 / 申請中'),
              _StatusTile(label: 'メッセージ', value: '一般就労先でも報連相を安定させたいです'),
            ],
          ),
        ),
      ),
    );
  }
}

class EmploymentTransitionsPage extends StatelessWidget {
  const EmploymentTransitionsPage({
    super.key,
    required this.actorRole,
  });

  final String actorRole;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context,
          title: actorRole == 'admin' ? '一般就労移行管理' : '一般就労移行一覧'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final transition in employmentTransitions)
              Card(
                child: ListTile(
                  onTap: () => Navigator.pushNamed(context,
                      '/$actorRole/employment-transitions/${transition.id}'),
                  leading: const Icon(Icons.work_history_outlined),
                  title:
                      Text('${transition.status} / ${transition.workerName}'),
                  subtitle: Text(
                      '${transition.fromContext} -> ${transition.toContext}'),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class EmploymentTransitionDetailPage extends StatelessWidget {
  const EmploymentTransitionDetailPage({
    super.key,
    required this.transitionId,
    required this.actorRole,
  });

  final String transitionId;
  final String actorRole;

  @override
  Widget build(BuildContext context) {
    final transition = employmentTransitions.firstWhere(
      (item) => item.id == transitionId,
      orElse: () => employmentTransitions.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: '一般就労移行詳細'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'actorRole', value: actorRole),
            _StatusTile(label: 'status', value: transition.status),
            _StatusTile(
                label: 'from/to',
                value: '${transition.fromContext} -> ${transition.toContext}'),
            _StatusTile(label: 'oldManagerId', value: transition.oldManagerId),
            _StatusTile(label: 'newManagerId', value: transition.newManagerId),
            _StatusTile(
                label: 'oldSupporterId', value: transition.oldSupporterId),
            _StatusTile(
                label: 'newSupporterId', value: transition.newSupporterId),
            _StatusTile(
                label: 'transitionRecipientPolicy',
                value: transition.transitionRecipientPolicy),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '完了理由',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('完了確認'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('キャンセル'),
            ),
          ],
        ),
      ),
    );
  }
}

class SupporterModeSwitchRequestsPage extends StatelessWidget {
  const SupporterModeSwitchRequestsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return _ModeSwitchRequestsScaffold(
      title: 'モード切替申請一覧',
      actorRole: 'supporter',
      requests: modeSwitchRequests
          .where((request) => request.supporterEmail == 'supporter@example.com')
          .toList(),
    );
  }
}

class AdminModeSwitchRequestsPage extends StatelessWidget {
  const AdminModeSwitchRequestsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _ModeSwitchRequestsScaffold(
      title: 'モード切替申請管理',
      actorRole: 'admin',
      requests: modeSwitchRequests,
    );
  }
}

class _ModeSwitchRequestsScaffold extends StatelessWidget {
  const _ModeSwitchRequestsScaffold({
    required this.title,
    required this.actorRole,
    required this.requests,
  });

  final String title;
  final String actorRole;
  final List<ModeSwitchRequestItem> requests;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: title),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final request in requests)
              Card(
                child: ListTile(
                  onTap: () => Navigator.pushNamed(
                    context,
                    '/$actorRole/mode-switch-requests/${request.id}',
                  ),
                  leading: const Icon(Icons.sync_alt),
                  title: Text(request.workerName),
                  subtitle: Text(
                    '${employmentContextLabel(request.employmentContext)} / '
                    '${requestStatusLabel(request.status)}',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class ModeSwitchRequestDetailPage extends StatelessWidget {
  const ModeSwitchRequestDetailPage({
    super.key,
    required this.requestId,
    required this.actorRole,
  });

  final String requestId;
  final String actorRole;

  @override
  Widget build(BuildContext context) {
    final request = modeSwitchRequests.firstWhere(
      (item) => item.id == requestId,
      orElse: () => modeSwitchRequests.first,
    );

    return Scaffold(
      appBar: _commonAppBar(context, title: 'モード切替申請詳細'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: '利用者', value: request.workerName),
            _StatusTile(label: '支援員メールアドレス', value: request.supporterEmail),
            _StatusTile(
                label: '希望する就労状況',
                value: employmentContextLabel(request.employmentContext)),
            _StatusTile(label: 'メッセージ', value: request.message),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '上司ID',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '支援員ID',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '確認コメント',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              value: true,
              onChanged: (_) {},
              title: const Text('AM/PM通知を報告スケジュールへ移行'),
            ),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('承認してworkerSettings/assignmentsを作成'),
            ),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('却下する'),
            ),
            if (request.reviewComment.isNotEmpty)
              _StatusTile(label: '却下理由', value: request.reviewComment),
          ],
        ),
      ),
    );
  }
}

const _reportTypes = ['AM_START', 'AM_END', 'PM_START', 'PM_END'];

String _reportTypeFromEventId(String eventId) {
  for (final type in _reportTypes) {
    if (eventId.contains(type)) {
      return type;
    }
  }
  return 'AM_START';
}

String _primaryReportFieldLabel(String reportType) {
  switch (reportType) {
    case 'AM_END':
      return '午前にできたこと';
    case 'PM_START':
      return '午後にやること';
    case 'PM_END':
      return '今日できたこと';
    case 'AM_START':
    default:
      return '今日やること';
  }
}

String _generatedReportPreview(String reportType) {
  switch (reportType) {
    case 'AM_END':
      return '''
お疲れさまです。
午前の作業を終了します。
午前は在庫確認まで完了しました。
相談したいこと：午後の優先順位を相談したいです
補足：10件完了しました''';
    case 'PM_START':
      return '''
お疲れさまです。
これから午後の作業を開始します。
午後は商品登録に取り組みます。
相談したいこと：確認方法を相談したいです
補足：15時に共有します''';
    case 'PM_END':
      return '''
お疲れさまです。
本日の作業を終了します。
本日は商品登録と在庫確認まで完了しました。
相談したいこと：明日の進め方を相談したいです
補足：残り2件です''';
    case 'AM_START':
    default:
      return '''
おはようございます。
これから午前の作業を開始します。
本日は在庫確認に取り組みます。
相談したいこと：優先順位を相談したいです
補足：午後に確認します''';
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
    final reportType = _reportTypeFromEventId(eventId);
    final generatedText = _generatedReportPreview(reportType);

    return Scaffold(
      appBar: _commonAppBar(context, title: '$reportType報告'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: '対象イベント', value: eventId),
            const SizedBox(height: 12),
            const _SensitiveInfoNotice(),
            const SizedBox(height: 12),
            TextField(
              decoration: InputDecoration(
                labelText: _primaryReportFieldLabel(reportType),
                border: const OutlineInputBorder(),
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
            Text(
              generatedText,
              key: const Key('generatedReportText'),
            ),
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
            const _StatusTile(
                label: 'delivery', value: 'manager@example.com failed'),
            OutlinedButton.icon(
              key: const Key('retryReportDeliveryButton'),
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

class WorkerReportsPage extends StatelessWidget {
  const WorkerReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '報告履歴'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const _StatusTile(label: '表示範囲', value: '過去90日分'),
            Card(
              child: ListTile(
                onTap: () =>
                    Navigator.pushNamed(context, '/worker/reports/report-1'),
                leading: const Icon(Icons.description_outlined),
                title: const Text('AM_START / 2026/07/07 09:05'),
                subtitle:
                    const Text('送信先: Supporter One / 送信状態: failed / 相談あり'),
                trailing: const Icon(Icons.chevron_right),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class WorkerReportDetailPage extends StatelessWidget {
  const WorkerReportDetailPage({
    super.key,
    required this.reportId,
  });

  final String reportId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '報告詳細'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: 'reportId', value: reportId),
            const _StatusTile(label: 'reportEvents.status', value: 'reported'),
            const SizedBox(height: 12),
            const _SectionTitle('報告本文'),
            const Text('おはようございます。午前は在庫確認を進めます。'),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => Navigator.pushNamed(
                context,
                '/worker/reports/$reportId/correction',
              ),
              icon: const Icon(Icons.edit_note),
              label: const Text('訂正版作成'),
            ),
            const SizedBox(height: 8),
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

class WorkerReportCorrectionPage extends StatelessWidget {
  const WorkerReportCorrectionPage({
    super.key,
    required this.reportId,
  });

  final String reportId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '訂正版作成'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _StatusTile(label: '対象報告', value: reportId),
            const TextField(
              decoration: InputDecoration(
                labelText: '訂正理由',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            const TextField(
              decoration: InputDecoration(
                labelText: '訂正文',
                border: OutlineInputBorder(),
              ),
              maxLines: 6,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.save),
              label: const Text('訂正版を作成'),
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

class _ManagerReportListTile extends StatelessWidget {
  const _ManagerReportListTile({
    required this.report,
  });

  final ReviewReportItem report;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: () =>
            Navigator.pushNamed(context, '/manager/reports/${report.id}'),
        leading: Icon(report.hasConsultation
            ? Icons.forum_outlined
            : Icons.description_outlined),
        title: Text(report.workerName),
        subtitle:
            Text('${report.type} / ${report.submittedAt} / ${report.status}'
                '${report.hasConsultation ? ' / 相談あり' : ''}'),
        trailing: const Icon(Icons.chevron_right),
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
        OutlinedButton.icon(
          onPressed: () => Navigator.pushNamed(context, '/admin/audit-logs'),
          icon: const Icon(Icons.manage_search),
          label: const Text('監査ログ'),
        ),
        OutlinedButton.icon(
          onPressed: () =>
              Navigator.pushNamed(context, '/admin/mode-switch-requests'),
          icon: const Icon(Icons.sync_alt),
          label: const Text('モード切替申請'),
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
        leading: Icon(
            schedule.isCustom ? Icons.notifications_active : Icons.schedule),
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
              onPressed: () =>
                  Navigator.pushNamed(context, '/notification/mode-switch'),
              icon: const Icon(Icons.sync_alt),
              label: const Text('報告支援モードへ切り替え'),
            ),
          ],
        ),
      ),
    );
  }
}

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: 'プライバシーポリシー'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            _SectionTitle('利用目的'),
            Text(
                'ホウレンチェックは、報告タイミングの通知、報告文作成支援、報連相支援、一般就労移行および定着支援のために必要な情報を扱います。診断支援、医療情報管理、勤怠管理、人事評価を目的としません。'),
            SizedBox(height: 16),
            _SectionTitle('保存期間'),
            Text(
                '通知イベントと通知ログは30日、報告本文と送信履歴は180日を目安に削除または匿名化します。監査ログは不正防止と説明責任のため保存し、本文の閲覧理由を記録します。'),
            SizedBox(height: 16),
            _SectionTitle('問い合わせ窓口'),
            Text('問い合わせ窓口: support@example.com'),
          ],
        ),
      ),
    );
  }
}

class TermsOfServicePage extends StatelessWidget {
  const TermsOfServicePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _commonAppBar(context, title: '利用規約'),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: const [
            _SectionTitle('サービスの位置づけ'),
            Text('本サービスは報連相支援ツールです。勤怠管理、給与管理、人事評価、医療情報管理、障害情報管理、診断支援には使用しません。'),
            SizedBox(height: 16),
            _SectionTitle('入力時の注意'),
            Text(
                '報告本文および相談内容には、業務報告に不要なセンシティブ情報を入力しないでください。体調、診断名、家庭事情などは必要最小限にしてください。'),
            SizedBox(height: 16),
            _SectionTitle('通知とメール'),
            Text(
                '通知やメールの不達、遅延、端末設定による未着について、サービスは完全な到達を保証しません。重要な連絡は必要に応じて別手段でも確認してください。'),
          ],
        ),
      ),
    );
  }
}

class _SensitiveInfoNotice extends StatelessWidget {
  const _SensitiveInfoNotice();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.privacy_tip_outlined),
                SizedBox(width: 8),
                Expanded(child: Text('センシティブ情報の入力に注意')),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
                '健康情報、障害情報、家庭事情など、業務報告に不要なセンシティブ情報は入力しないでください。この報告は報連相支援のために使い、人事評価や勤怠管理には使用しません。'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                TextButton(
                  onPressed: () =>
                      Navigator.pushNamed(context, '/legal/privacy'),
                  child: const Text('プライバシー'),
                ),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/legal/terms'),
                  child: const Text('利用規約'),
                ),
              ],
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
