import {
  DeliveryStatus,
  NotificationLogDocument,
  NotificationSettingsDocument,
  ReportEventDocument,
  ReportType,
  ReportScheduleDocument,
  WorkerSettingsDocument
} from "../domain/firestoreModels";

export interface GenerateDailyReportEventsInput {
  schedules: ReportScheduleDocument[];
  existingEvents: ReportEventDocument[];
  workerSettingsByWorkerId: Record<string, WorkerSettingsDocument | undefined>;
  activeUserIds?: Set<string>;
  targetDate: Date;
}

export interface ReportReminderMessage {
  event: ReportEventDocument;
  title: string;
  body: string;
  token: string;
  clickUrl: string;
}

export interface SendDueReportRemindersInput {
  events: ReportEventDocument[];
  settingsByUserId: Record<string, NotificationSettingsDocument | undefined>;
  now: Date;
  pushSender: (message: ReportReminderMessage) => Promise<void>;
}

export interface SendDueReportRemindersResult {
  events: ReportEventDocument[];
  logs: NotificationLogDocument[];
}

const REPORT_REMINDER_TITLES: Record<ReportType, string> = {
  AM_START: "AM開始報告の時間です",
  AM_END: "AM終了報告の時間です",
  PM_START: "PM開始報告の時間です",
  PM_END: "PM終了報告の時間です"
};

function buildDueAt(targetDate: Date, time: string): Date {
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate(),
    hour,
    minute,
    0,
    0
  ));
}

function shouldGenerate(schedule: ReportScheduleDocument, targetDate: Date): boolean {
  return schedule.enabled
    && schedule.dayOfWeek.includes(targetDate.getUTCDay());
}

function isActiveWorker(schedule: ReportScheduleDocument, activeUserIds?: Set<string>): boolean {
  return activeUserIds === undefined || activeUserIds.has(schedule.workerId);
}

function reportEventId(input: {
  workerId: string;
  type: string;
  dueAt: Date;
}): string {
  return `${input.workerId}_${input.type}_${input.dueAt.toISOString()}`;
}

function eventKey(input: {
  workerId: string;
  type: string;
  dueAt: Date;
}): string {
  return reportEventId(input);
}

export function generateDailyReportEventDocuments(
  input: GenerateDailyReportEventsInput,
  now = new Date()
): ReportEventDocument[] {
  const existingKeys = new Set(input.existingEvents.map((event) => eventKey(event)));

  return input.schedules
    .filter((schedule) => shouldGenerate(schedule, input.targetDate))
    .filter((schedule) => isActiveWorker(schedule, input.activeUserIds))
    .flatMap((schedule) => {
      const workerSettings = input.workerSettingsByWorkerId[schedule.workerId];
      if (workerSettings === undefined) {
        return [];
      }
      const dueAt = buildDueAt(input.targetDate, schedule.time);
      const key = eventKey({
        workerId: schedule.workerId,
        type: schedule.type,
        dueAt
      });
      if (existingKeys.has(key)) {
        return [];
      }

      return [{
        id: key,
        scheduleId: schedule.id,
        workerId: schedule.workerId,
        organizationId: schedule.organizationId,
        type: schedule.type,
        dueAt,
        status: "pending" as const,
        workStyle: schedule.workStyle,
        employmentContext: workerSettings.defaultEmploymentContext,
        notificationCount: 0,
        createdAt: now,
        updatedAt: now
      }];
    });
}

function createLog(input: {
  event: ReportEventDocument;
  channel: "push" | "in_app";
  status: DeliveryStatus;
  now: Date;
  errorMessage?: string;
}): NotificationLogDocument {
  return {
    id: `${input.event.id}_${input.channel}_${input.now.getTime()}_${input.status}`,
    userId: input.event.workerId,
    eventId: input.event.id,
    accountMode: "report_support_mode",
    notificationType: input.event.type,
    channel: input.channel,
    status: input.status,
    errorMessage: input.errorMessage,
    sentAt: input.status === "sent" ? input.now : undefined,
    createdAt: input.now
  };
}

function safeReportReminderMessage(event: ReportEventDocument, token: string): ReportReminderMessage {
  return {
    event,
    title: REPORT_REMINDER_TITLES[event.type],
    body: "報告時間になりました",
    token,
    clickUrl: `/worker/today/report/${event.id}`
  };
}

function isDue(event: ReportEventDocument, now: Date): boolean {
  return event.status === "pending" && event.dueAt.getTime() <= now.getTime();
}

export async function sendDueReportReminders(
  input: SendDueReportRemindersInput
): Promise<SendDueReportRemindersResult> {
  const updatedEvents: ReportEventDocument[] = [];
  const logs: NotificationLogDocument[] = [];

  for (const event of input.events) {
    const settings = input.settingsByUserId[event.workerId];
    if (!isDue(event, input.now) || settings === undefined || !settings.pushEnabled
      || settings.fcmToken === undefined) {
      continue;
    }

    logs.push(createLog({
      event,
      channel: "in_app",
      status: "sent",
      now: input.now
    }));

    try {
      await input.pushSender(safeReportReminderMessage(event, settings.fcmToken));
      logs.push(createLog({
        event,
        channel: "push",
        status: "sent",
        now: input.now
      }));
      updatedEvents.push({
        ...event,
        status: "notified",
        notificationCount: event.notificationCount + 1,
        lastNotifiedAt: input.now,
        updatedAt: input.now
      });
    } catch (error) {
      logs.push(createLog({
        event,
        channel: "push",
        status: "failed",
        now: input.now,
        errorMessage: error instanceof Error ? error.message : "push failed"
      }));
    }
  }

  return {
    events: updatedEvents,
    logs
  };
}
