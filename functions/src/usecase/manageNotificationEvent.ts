import {
  DeliveryStatus,
  NotificationEventDocument,
  NotificationLogDocument,
  NotificationScheduleDocument,
  NotificationSettingsDocument
} from "../domain/firestoreModels";

export type NotificationEventErrorCode =
  | "NOTIFICATION_EVENT_ALREADY_FINALIZED"
  | "NOTIFICATION_EVENT_NOT_FOUND"
  | "NOTIFICATION_SCHEDULE_NOT_FOUND";

export class NotificationEventError extends Error {
  constructor(readonly code: NotificationEventErrorCode, message: string) {
    super(message);
    this.name = "NotificationEventError";
  }
}

export interface GenerateDailyNotificationEventsInput {
  schedules: NotificationScheduleDocument[];
  existingEvents: NotificationEventDocument[];
  activeUserIds?: Set<string>;
  targetDate: Date;
}

export interface NotificationMessage {
  event: NotificationEventDocument;
  title: string;
  body: string;
  token?: string;
  to?: string;
}

export interface SendDueNotificationRemindersInput {
  events: NotificationEventDocument[];
  schedulesById: Record<string, NotificationScheduleDocument | undefined>;
  settingsByUserId: Record<string, NotificationSettingsDocument | undefined>;
  now: Date;
  pushSender: (message: NotificationMessage) => Promise<void>;
  mailer: (message: NotificationMessage) => Promise<void>;
}

export interface SendDueNotificationRemindersResult {
  events: NotificationEventDocument[];
  logs: NotificationLogDocument[];
}

export interface SnoozeNotificationEventInput {
  existingEvent: NotificationEventDocument;
  schedule: NotificationScheduleDocument;
  now: Date;
}

export interface CancelNotificationEventInput {
  existingEvent: NotificationEventDocument;
}

export interface ListRecentNotificationLogsInput {
  logs: NotificationLogDocument[];
  userId: string;
  now: Date;
}

export interface RegisterFcmTokenInput {
  existingSettings: NotificationSettingsDocument;
  fcmToken: string;
}

export interface UnregisterFcmTokenInput {
  existingSettings: NotificationSettingsDocument;
}

export interface UpdateNotificationSettingsInput {
  existingSettings: NotificationSettingsDocument;
  patch: Partial<Pick<
    NotificationSettingsDocument,
    "pushEnabled" | "mailEnabled" | "soundEnabled" | "fallbackEmail"
  >>;
}

function formatDateId(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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

function shouldGenerate(schedule: NotificationScheduleDocument, targetDate: Date): boolean {
  return schedule.enabled
    && schedule.deletedAt === undefined
    && schedule.dayOfWeek.includes(targetDate.getUTCDay());
}

function isActiveUser(schedule: NotificationScheduleDocument, activeUserIds?: Set<string>): boolean {
  return activeUserIds === undefined || activeUserIds.has(schedule.userId);
}

export function generateDailyNotificationEventDocuments(
  input: GenerateDailyNotificationEventsInput,
  now = new Date()
): NotificationEventDocument[] {
  const dateId = formatDateId(input.targetDate);
  const existingIds = new Set(input.existingEvents.map((event) => event.id));

  return input.schedules
    .filter((schedule) => shouldGenerate(schedule, input.targetDate))
    .filter((schedule) => isActiveUser(schedule, input.activeUserIds))
    .map((schedule) => ({
      id: `${schedule.id}_${dateId}`,
      scheduleId: schedule.id,
      userId: schedule.userId,
      title: schedule.title,
      type: schedule.type,
      dueAt: buildDueAt(input.targetDate, schedule.time),
      status: "pending" as const,
      notificationCount: 0,
      createdAt: now,
      updatedAt: now
    }))
    .filter((event) => !existingIds.has(event.id));
}

function isDueForReminder(
  event: NotificationEventDocument,
  schedule: NotificationScheduleDocument,
  now: Date
): boolean {
  if (event.status !== "pending" && event.status !== "snoozed") {
    return false;
  }
  if (event.dueAt.getTime() > now.getTime()) {
    return false;
  }
  if (event.status === "snoozed" && event.snoozeUntil !== undefined
    && event.snoozeUntil.getTime() > now.getTime()) {
    return false;
  }
  if (event.lastNotifiedAt === undefined) {
    return true;
  }

  const elapsedMs = now.getTime() - event.lastNotifiedAt.getTime();
  return elapsedMs >= schedule.repeatIntervalMinutes * 60 * 1000;
}

function createLog(input: {
  event: NotificationEventDocument;
  channel: "email" | "push" | "in_app";
  status: DeliveryStatus;
  now: Date;
  errorMessage?: string;
}): NotificationLogDocument {
  return {
    id: `${input.event.id}_${input.channel}_${input.now.getTime()}_${input.status}`,
    userId: input.event.userId,
    eventId: input.event.id,
    accountMode: "notification_mode",
    notificationType: input.event.type,
    channel: input.channel,
    status: input.status,
    errorMessage: input.errorMessage,
    sentAt: input.status === "sent" ? input.now : undefined,
    createdAt: input.now
  };
}

async function trySendPush(
  input: SendDueNotificationRemindersInput,
  event: NotificationEventDocument,
  settings: NotificationSettingsDocument,
  logs: NotificationLogDocument[]
): Promise<boolean> {
  if (!settings.pushEnabled || settings.fcmToken === undefined) {
    return false;
  }

  try {
    await input.pushSender({
      event,
      title: event.title,
      body: event.title,
      token: settings.fcmToken
    });
    logs.push(createLog({
      event,
      channel: "push",
      status: "sent",
      now: input.now
    }));
    return true;
  } catch (error) {
    logs.push(createLog({
      event,
      channel: "push",
      status: "failed",
      now: input.now,
      errorMessage: error instanceof Error ? error.message : "push failed"
    }));
    return false;
  }
}

async function trySendEmailFallback(
  input: SendDueNotificationRemindersInput,
  event: NotificationEventDocument,
  schedule: NotificationScheduleDocument,
  settings: NotificationSettingsDocument,
  logs: NotificationLogDocument[]
): Promise<void> {
  if (!schedule.mailFallbackEnabled || !settings.mailEnabled || settings.fallbackEmail === undefined) {
    return;
  }

  try {
    await input.mailer({
      event,
      title: event.title,
      body: event.title,
      to: settings.fallbackEmail
    });
    logs.push(createLog({
      event,
      channel: "email",
      status: "sent",
      now: input.now
    }));
  } catch (error) {
    logs.push(createLog({
      event,
      channel: "email",
      status: "failed",
      now: input.now,
      errorMessage: error instanceof Error ? error.message : "mail failed"
    }));
  }
}

export async function sendDueNotificationReminders(
  input: SendDueNotificationRemindersInput
): Promise<SendDueNotificationRemindersResult> {
  const updatedEvents: NotificationEventDocument[] = [];
  const logs: NotificationLogDocument[] = [];

  for (const event of input.events) {
    const schedule = input.schedulesById[event.scheduleId];
    const settings = input.settingsByUserId[event.userId];
    if (schedule === undefined || settings === undefined || !isDueForReminder(event, schedule, input.now)) {
      continue;
    }

    logs.push(createLog({
      event,
      channel: "in_app",
      status: "sent",
      now: input.now
    }));

    const pushSent = await trySendPush(input, event, settings, logs);
    if (!pushSent) {
      await trySendEmailFallback(input, event, schedule, settings, logs);
    }

    const nextCount = event.notificationCount + 1;
    updatedEvents.push({
      ...event,
      status: nextCount >= schedule.repeatLimitCount ? "notified" : "pending",
      notificationCount: nextCount,
      lastNotifiedAt: input.now,
      snoozeUntil: undefined,
      updatedAt: input.now
    });
  }

  return {
    events: updatedEvents,
    logs
  };
}

export function snoozeNotificationEventDocument(
  input: SnoozeNotificationEventInput
): NotificationEventDocument {
  return {
    ...input.existingEvent,
    status: "snoozed",
    snoozeUntil: new Date(input.now.getTime() + input.schedule.snoozeMinutes * 60 * 1000),
    updatedAt: input.now
  };
}

export function cancelNotificationEventDocument(
  input: CancelNotificationEventInput,
  now = new Date()
): NotificationEventDocument {
  if (input.existingEvent.status !== "pending" && input.existingEvent.status !== "snoozed") {
    throw new NotificationEventError(
      "NOTIFICATION_EVENT_ALREADY_FINALIZED",
      "only pending or snoozed notification events can be cancelled"
    );
  }

  return {
    ...input.existingEvent,
    status: "cancelled",
    updatedAt: now
  };
}

export function listRecentNotificationLogs(
  input: ListRecentNotificationLogsInput
): NotificationLogDocument[] {
  const since = new Date(input.now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return input.logs
    .filter((log) => log.userId === input.userId && log.createdAt.getTime() >= since.getTime())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function registerFcmTokenDocument(
  input: RegisterFcmTokenInput,
  now = new Date()
): NotificationSettingsDocument {
  return {
    ...input.existingSettings,
    fcmToken: input.fcmToken.trim(),
    pushEnabled: true,
    updatedAt: now
  };
}

export function unregisterFcmTokenDocument(
  input: UnregisterFcmTokenInput,
  now = new Date()
): NotificationSettingsDocument {
  const { fcmToken: _fcmToken, ...settingsWithoutToken } = input.existingSettings;
  return {
    ...settingsWithoutToken,
    pushEnabled: false,
    updatedAt: now
  };
}

export function updateNotificationSettingsDocument(
  input: UpdateNotificationSettingsInput,
  now = new Date()
): NotificationSettingsDocument {
  return {
    ...input.existingSettings,
    pushEnabled: input.patch.pushEnabled ?? input.existingSettings.pushEnabled,
    mailEnabled: input.patch.mailEnabled ?? input.existingSettings.mailEnabled,
    soundEnabled: input.patch.soundEnabled ?? input.existingSettings.soundEnabled,
    fallbackEmail: input.patch.fallbackEmail?.trim() ?? input.existingSettings.fallbackEmail,
    updatedAt: now
  };
}
