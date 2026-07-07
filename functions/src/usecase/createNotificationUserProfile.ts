import {
  NotificationScheduleDocument,
  NotificationSettingsDocument,
  UserDocument
} from "../domain/firestoreModels";

export interface CreateNotificationUserProfileInput {
  uid: string;
  name: string;
  email: string;
  organizationId?: string;
  fallbackEmail?: string;
}

export interface CreateNotificationUserProfileResult {
  user: UserDocument;
  notificationSettings: NotificationSettingsDocument;
  notificationSchedules: NotificationScheduleDocument[];
}

const initialSchedules = [
  {
    type: "AM_START" as const,
    title: "AM開始報告の時間です",
    time: "09:00"
  },
  {
    type: "AM_END" as const,
    title: "AM終了報告の時間です",
    time: "12:00"
  },
  {
    type: "PM_START" as const,
    title: "PM開始報告の時間です",
    time: "13:00"
  },
  {
    type: "PM_END" as const,
    title: "PM終了報告の時間です",
    time: "17:00"
  }
];

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

export function createNotificationUserProfileDocuments(
  input: CreateNotificationUserProfileInput,
  now = new Date()
): CreateNotificationUserProfileResult {
  const uid = requireNonEmpty(input.uid, "uid");
  const name = requireNonEmpty(input.name, "name");
  const email = requireNonEmpty(input.email, "email").toLowerCase();
  const organizationId = input.organizationId?.trim() || "personal";

  const user: UserDocument = {
    id: uid,
    name,
    email,
    role: "worker",
    accountMode: "notification_mode",
    organizationId,
    active: true,
    createdAt: now,
    updatedAt: now
  };

  const notificationSettings: NotificationSettingsDocument = {
    userId: uid,
    pushEnabled: false,
    mailEnabled: true,
    soundEnabled: true,
    fallbackEmail: input.fallbackEmail?.trim() || email,
    createdAt: now,
    updatedAt: now
  };

  const notificationSchedules = initialSchedules.map((schedule) => ({
    id: `${uid}_${schedule.type}`,
    userId: uid,
    title: schedule.title,
    type: schedule.type,
    time: schedule.time,
    dayOfWeek: [1, 2, 3, 4, 5],
    enabled: true,
    snoozeMinutes: 5,
    repeatIntervalMinutes: 5,
    repeatLimitCount: 3,
    mailFallbackEnabled: true,
    createdAt: now,
    updatedAt: now
  }));

  return {
    user,
    notificationSettings,
    notificationSchedules
  };
}
