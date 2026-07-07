import {
  NotificationScheduleDocument,
  NotificationType
} from "../domain/firestoreModels";

export type NotificationScheduleErrorCode =
  | "CUSTOM_NOTIFICATION_LIMIT_REACHED"
  | "INITIAL_NOTIFICATION_DELETE_NOT_ALLOWED"
  | "INITIAL_NOTIFICATION_IMMUTABLE_FIELD"
  | "INVALID_DAY_OF_WEEK"
  | "INVALID_TIME_FORMAT"
  | "NOTIFICATION_SCHEDULE_NOT_FOUND";

export class NotificationScheduleError extends Error {
  constructor(readonly code: NotificationScheduleErrorCode, message: string) {
    super(message);
    this.name = "NotificationScheduleError";
  }
}

export interface CreateNotificationScheduleInput {
  id: string;
  userId: string;
  title: string;
  time: string;
  dayOfWeek: number[];
  enabled?: boolean;
  snoozeMinutes?: number;
  repeatIntervalMinutes?: number;
  repeatLimitCount?: number;
  mailFallbackEnabled?: boolean;
  existingCustomSchedules: NotificationScheduleDocument[];
}

export interface UpdateNotificationScheduleInput {
  existingSchedule: NotificationScheduleDocument;
  patch: Partial<Pick<
    NotificationScheduleDocument,
    | "title"
    | "type"
    | "time"
    | "dayOfWeek"
    | "enabled"
    | "snoozeMinutes"
    | "repeatIntervalMinutes"
    | "repeatLimitCount"
    | "mailFallbackEnabled"
  >>;
}

export interface DeleteNotificationScheduleInput {
  existingSchedule: NotificationScheduleDocument;
}

const initialNotificationTypes: readonly NotificationType[] = [
  "AM_START",
  "AM_END",
  "PM_START",
  "PM_END"
];

const initialScheduleEditableFields = new Set(["time", "dayOfWeek", "enabled"]);

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

function assertValidTime(time: string): string {
  const normalized = requireNonEmpty(time, "time");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
    throw new NotificationScheduleError("INVALID_TIME_FORMAT", "time must be HH:mm");
  }
  return normalized;
}

function assertValidDayOfWeek(dayOfWeek: number[]): number[] {
  if (!Array.isArray(dayOfWeek) || dayOfWeek.length === 0) {
    throw new NotificationScheduleError(
      "INVALID_DAY_OF_WEEK",
      "dayOfWeek must include at least one weekday"
    );
  }

  const normalized = [...new Set(dayOfWeek)];
  if (normalized.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new NotificationScheduleError(
      "INVALID_DAY_OF_WEEK",
      "dayOfWeek must contain integers from 0 to 6"
    );
  }
  return normalized.sort((a, b) => a - b);
}

function isInitialSchedule(schedule: NotificationScheduleDocument): boolean {
  return initialNotificationTypes.includes(schedule.type);
}

export function createNotificationScheduleDocument(
  input: CreateNotificationScheduleInput,
  now = new Date()
): NotificationScheduleDocument {
  const activeCustomCount = input.existingCustomSchedules.filter(
    (schedule) => schedule.type === "CUSTOM" && schedule.deletedAt === undefined
  ).length;
  if (activeCustomCount >= 10) {
    throw new NotificationScheduleError(
      "CUSTOM_NOTIFICATION_LIMIT_REACHED",
      "custom notification schedules are limited to 10"
    );
  }

  return {
    id: requireNonEmpty(input.id, "id"),
    userId: requireNonEmpty(input.userId, "userId"),
    title: requireNonEmpty(input.title, "title"),
    type: "CUSTOM",
    time: assertValidTime(input.time),
    dayOfWeek: assertValidDayOfWeek(input.dayOfWeek),
    enabled: input.enabled ?? true,
    snoozeMinutes: input.snoozeMinutes ?? 5,
    repeatIntervalMinutes: input.repeatIntervalMinutes ?? 5,
    repeatLimitCount: input.repeatLimitCount ?? 3,
    mailFallbackEnabled: input.mailFallbackEnabled ?? true,
    createdAt: now,
    updatedAt: now
  };
}

export function updateNotificationScheduleDocument(
  input: UpdateNotificationScheduleInput,
  now = new Date()
): NotificationScheduleDocument {
  const schedule = input.existingSchedule;
  const patch = input.patch;

  if (isInitialSchedule(schedule)) {
    const disallowedField = Object.keys(patch).find(
      (field) => !initialScheduleEditableFields.has(field)
    );
    if (disallowedField !== undefined) {
      throw new NotificationScheduleError(
        "INITIAL_NOTIFICATION_IMMUTABLE_FIELD",
        `initial notification ${disallowedField} cannot be changed`
      );
    }
    if (patch.type !== undefined && patch.type !== schedule.type) {
      throw new NotificationScheduleError(
        "INITIAL_NOTIFICATION_IMMUTABLE_FIELD",
        "initial notification type cannot be changed"
      );
    }
    if (patch.title !== undefined && patch.title !== schedule.title) {
      throw new NotificationScheduleError(
        "INITIAL_NOTIFICATION_IMMUTABLE_FIELD",
        "initial notification title cannot be changed"
      );
    }
  }

  return {
    ...schedule,
    title: isInitialSchedule(schedule) ? schedule.title : patch.title?.trim() || schedule.title,
    type: isInitialSchedule(schedule) ? schedule.type : patch.type ?? schedule.type,
    time: patch.time === undefined ? schedule.time : assertValidTime(patch.time),
    dayOfWeek: patch.dayOfWeek === undefined
      ? schedule.dayOfWeek
      : assertValidDayOfWeek(patch.dayOfWeek),
    enabled: patch.enabled ?? schedule.enabled,
    snoozeMinutes: isInitialSchedule(schedule)
      ? schedule.snoozeMinutes
      : patch.snoozeMinutes ?? schedule.snoozeMinutes,
    repeatIntervalMinutes: isInitialSchedule(schedule)
      ? schedule.repeatIntervalMinutes
      : patch.repeatIntervalMinutes ?? schedule.repeatIntervalMinutes,
    repeatLimitCount: isInitialSchedule(schedule)
      ? schedule.repeatLimitCount
      : patch.repeatLimitCount ?? schedule.repeatLimitCount,
    mailFallbackEnabled: isInitialSchedule(schedule)
      ? schedule.mailFallbackEnabled
      : patch.mailFallbackEnabled ?? schedule.mailFallbackEnabled,
    updatedAt: now
  };
}

export function deleteNotificationScheduleDocument(
  input: DeleteNotificationScheduleInput,
  now = new Date()
): NotificationScheduleDocument {
  if (isInitialSchedule(input.existingSchedule)) {
    throw new NotificationScheduleError(
      "INITIAL_NOTIFICATION_DELETE_NOT_ALLOWED",
      "initial notification schedules cannot be deleted"
    );
  }

  return {
    ...input.existingSchedule,
    enabled: false,
    deletedAt: now,
    updatedAt: now
  };
}
