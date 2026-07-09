import {
  ReportScheduleDocument,
  ReportType,
  UserRole,
  WorkStyle
} from "../domain/firestoreModels";

export type ReportScheduleErrorCode =
  | "INVALID_DAY_OF_WEEK"
  | "INVALID_TIME_FORMAT"
  | "REPORT_SCHEDULE_ACTOR_NOT_ALLOWED"
  | "REPORT_TYPE_NOT_SUPPORTED";

const REPORT_TYPES: readonly ReportType[] = ["AM_START", "AM_END", "PM_START", "PM_END"];

export class ReportScheduleError extends Error {
  constructor(readonly code: ReportScheduleErrorCode, message: string) {
    super(message);
    this.name = "ReportScheduleError";
  }
}

export interface UpdateReportScheduleInput {
  id: string;
  workerId: string;
  organizationId: string;
  actorId: string;
  actorRole: UserRole;
  existingSchedule?: ReportScheduleDocument;
  patch: Partial<Pick<
    ReportScheduleDocument,
    "type" | "workStyle" | "time" | "dayOfWeek" | "enabled"
  >>;
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

function assertReportSupportActor(actorRole: UserRole): void {
  if (actorRole !== "manager" && actorRole !== "supporter" && actorRole !== "admin") {
    throw new ReportScheduleError(
      "REPORT_SCHEDULE_ACTOR_NOT_ALLOWED",
      "manager, supporter, or admin role is required"
    );
  }
}

function assertReportType(type: ReportType): ReportType {
  if (!REPORT_TYPES.includes(type)) {
    throw new ReportScheduleError(
      "REPORT_TYPE_NOT_SUPPORTED",
      "report type is not supported"
    );
  }
  return type;
}

function assertValidTime(time: string): string {
  const normalized = requireNonEmpty(time, "time");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
    throw new ReportScheduleError("INVALID_TIME_FORMAT", "time must be HH:mm");
  }
  return normalized;
}

function assertValidDayOfWeek(dayOfWeek: number[]): number[] {
  if (!Array.isArray(dayOfWeek) || dayOfWeek.length === 0) {
    throw new ReportScheduleError(
      "INVALID_DAY_OF_WEEK",
      "dayOfWeek must include at least one weekday"
    );
  }

  const normalized = [...new Set(dayOfWeek)];
  if (normalized.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new ReportScheduleError(
      "INVALID_DAY_OF_WEEK",
      "dayOfWeek must contain integers from 0 to 6"
    );
  }
  return normalized.sort((a, b) => a - b);
}

export function updateReportScheduleDocument(
  input: UpdateReportScheduleInput,
  now = new Date()
): ReportScheduleDocument {
  assertReportSupportActor(input.actorRole);

  const type = assertReportType((input.patch.type ?? input.existingSchedule?.type ?? "AM_START") as ReportType);
  const existing = input.existingSchedule;

  if (existing === undefined) {
    return {
      id: requireNonEmpty(input.id, "id"),
      workerId: requireNonEmpty(input.workerId, "workerId"),
      organizationId: requireNonEmpty(input.organizationId, "organizationId"),
      type,
      workStyle: (input.patch.workStyle ?? "remote") as WorkStyle,
      dayOfWeek: assertValidDayOfWeek(input.patch.dayOfWeek ?? [1, 2, 3, 4, 5]),
      time: assertValidTime(input.patch.time ?? "09:00"),
      enabled: input.patch.enabled ?? true,
      createdBy: requireNonEmpty(input.actorId, "actorId"),
      updatedBy: requireNonEmpty(input.actorId, "actorId"),
      createdAt: now,
      updatedAt: now
    };
  }

  return {
    ...existing,
    type,
    workStyle: (input.patch.workStyle ?? existing.workStyle) as WorkStyle,
    dayOfWeek: input.patch.dayOfWeek === undefined
      ? existing.dayOfWeek
      : assertValidDayOfWeek(input.patch.dayOfWeek),
    time: input.patch.time === undefined ? existing.time : assertValidTime(input.patch.time),
    enabled: input.patch.enabled ?? existing.enabled,
    updatedBy: requireNonEmpty(input.actorId, "actorId"),
    updatedAt: now
  };
}
