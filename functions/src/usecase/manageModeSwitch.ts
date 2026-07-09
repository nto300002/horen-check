import {
  AssignmentDocument,
  AuditLogDocument,
  EmploymentContext,
  ModeSwitchRequestDocument,
  ModeSwitchRequestMethod,
  NotificationScheduleDocument,
  ReportScheduleDocument,
  ReportType,
  ScheduleMigrationPolicy,
  UserDocument,
  UserRole,
  WorkerSettingsDocument
} from "../domain/firestoreModels";

type ModeSwitchDecision = "approved" | "rejected";

export class ModeSwitchError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ModeSwitchError";
  }
}

export interface CreateModeSwitchRequestInput {
  id: string;
  worker: UserDocument;
  requestMethod: ModeSwitchRequestMethod;
  requestedSupporterEmail?: string;
  requestedSupporterId?: string;
  inviteTokenId?: string;
  desiredEmploymentContext: EmploymentContext;
  message?: string;
  inheritNotificationSchedules: boolean;
  scheduleMigrationPolicy: ScheduleMigrationPolicy;
  managerId?: string;
  supporterId?: string;
  existingRequests: ModeSwitchRequestDocument[];
}

export interface ReviewModeSwitchRequestInput {
  request: ModeSwitchRequestDocument;
  worker: UserDocument;
  reviewerId: string;
  reviewerRole: Extract<UserRole, "supporter" | "admin">;
  decision: ModeSwitchDecision;
  managerId?: string;
  supporterId?: string;
  reviewComment?: string;
  notificationSchedules: NotificationScheduleDocument[];
}

export interface ReviewModeSwitchRequestResult {
  request: ModeSwitchRequestDocument;
  user: UserDocument;
  auditLog: AuditLogDocument;
  workerSettings?: WorkerSettingsDocument;
  assignment?: AssignmentDocument;
  reportSchedules: ReportScheduleDocument[];
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ModeSwitchError(`${fieldName.toUpperCase()}_REQUIRED`, `${fieldName} is required`);
  }
  return normalized;
}

function optionalTrim(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}

function normalizeEmail(value: string | undefined): string | undefined {
  const normalized = optionalTrim(value)?.toLowerCase();
  return normalized;
}

function assertPending(request: ModeSwitchRequestDocument): void {
  if (request.status !== "pending") {
    throw new ModeSwitchError("MODE_SWITCH_REQUEST_NOT_PENDING", "mode switch request is not pending");
  }
}

function assertNotificationModeWorker(worker: UserDocument): void {
  if (worker.role !== "worker" || worker.accountMode !== "notification_mode") {
    throw new ModeSwitchError(
      "NOTIFICATION_MODE_WORKER_REQUIRED",
      "notification mode worker is required"
    );
  }
}

function auditLog(input: {
  id: string;
  organizationId: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  targetUserId: string;
  reason?: string;
  now: Date;
}): AuditLogDocument {
  return {
    id: input.id,
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    targetType: "modeSwitchRequest",
    targetId: input.targetId,
    targetUserId: input.targetUserId,
    reason: input.reason,
    createdAt: input.now
  };
}

function createWorkerSettings(input: {
  workerId: string;
  organizationId: string;
  employmentContext: EmploymentContext;
  now: Date;
}): WorkerSettingsDocument {
  return {
    userId: input.workerId,
    organizationId: input.organizationId,
    defaultEmploymentContext: input.employmentContext,
    allowWorkerSelectRecipients: true,
    requiredRecipientPolicy: "employment_context_default",
    consultationRequiredRecipientPolicy: "supporter_and_manager",
    transitionRecipientPolicy: "supporter_and_manager",
    notifySupporterInGeneralEmployment: true,
    notifyManagerInSupportedFacility: true,
    missedVisibilityPolicy: "supporter_and_manager",
    soundEnabled: true,
    snoozeMinutes: 5,
    localDraftEnabled: true,
    displayPreferences: {},
    createdAt: input.now,
    updatedAt: input.now
  };
}

function createAssignment(input: {
  workerId: string;
  managerId?: string;
  supporterId?: string;
  organizationId: string;
  reviewerId: string;
  now: Date;
}): AssignmentDocument {
  return {
    id: input.workerId,
    workerId: input.workerId,
    managerId: input.managerId,
    supporterId: input.supporterId,
    organizationId: input.organizationId,
    active: true,
    createdBy: input.reviewerId,
    updatedBy: input.reviewerId,
    createdAt: input.now,
    updatedAt: input.now
  };
}

function isReportType(type: string): type is ReportType {
  return type === "AM_START" || type === "AM_END" || type === "PM_START" || type === "PM_END";
}

function migrateReportSchedules(input: {
  request: ModeSwitchRequestDocument;
  reviewerId: string;
  notificationSchedules: NotificationScheduleDocument[];
  now: Date;
}): ReportScheduleDocument[] {
  if (!input.request.inheritNotificationSchedules
    || input.request.scheduleMigrationPolicy === "none") {
    return [];
  }

  return input.notificationSchedules
    .filter((schedule) => schedule.userId === input.request.userId && isReportType(schedule.type))
    .map((schedule) => ({
      id: `${input.request.userId}_${schedule.type}`,
      workerId: input.request.userId,
      organizationId: input.request.organizationId,
      type: schedule.type as ReportType,
      workStyle: "remote",
      dayOfWeek: schedule.dayOfWeek,
      time: schedule.time,
      enabled: schedule.enabled,
      createdBy: input.reviewerId,
      updatedBy: input.reviewerId,
      createdAt: input.now,
      updatedAt: input.now
    }));
}

export function createModeSwitchRequestDocument(
  input: CreateModeSwitchRequestInput,
  now = new Date()
): { request: ModeSwitchRequestDocument } {
  assertNotificationModeWorker(input.worker);
  if (input.existingRequests.some((request) =>
    request.userId === input.worker.id && request.status === "pending"
  )) {
    throw new ModeSwitchError(
      "PENDING_MODE_SWITCH_EXISTS",
      "pending mode switch request already exists"
    );
  }

  const requestedSupporterEmail = normalizeEmail(input.requestedSupporterEmail);
  if (input.requestMethod === "supporter_email" && requestedSupporterEmail === undefined) {
    throw new ModeSwitchError("SUPPORTER_EMAIL_REQUIRED", "supporter email is required");
  }

  return {
    request: {
      id: requireNonEmpty(input.id, "id"),
      userId: input.worker.id,
      fromMode: "notification_mode",
      toMode: "report_support_mode",
      requestMethod: input.requestMethod,
      organizationId: input.worker.organizationId,
      requestedBy: input.worker.id,
      requestedSupporterEmail,
      requestedSupporterId: optionalTrim(input.requestedSupporterId),
      inviteTokenId: optionalTrim(input.inviteTokenId),
      desiredEmploymentContext: input.desiredEmploymentContext,
      message: optionalTrim(input.message),
      inheritNotificationSchedules: input.inheritNotificationSchedules,
      scheduleMigrationPolicy: input.scheduleMigrationPolicy,
      managerId: optionalTrim(input.managerId),
      supporterId: optionalTrim(input.supporterId),
      status: "pending",
      createdAt: now,
      updatedAt: now
    }
  };
}

export function cancelModeSwitchRequestDocument(
  input: { request: ModeSwitchRequestDocument; workerId: string },
  now = new Date()
): ModeSwitchRequestDocument {
  assertPending(input.request);
  if (input.request.userId !== input.workerId) {
    throw new ModeSwitchError("MODE_SWITCH_CANCEL_DENIED", "only requester can cancel");
  }
  return {
    ...input.request,
    status: "cancelled",
    updatedAt: now
  };
}

export function reviewModeSwitchRequestDocuments(
  input: ReviewModeSwitchRequestInput,
  now = new Date()
): ReviewModeSwitchRequestResult {
  assertPending(input.request);

  if (input.decision === "rejected") {
    const reviewComment = requireNonEmpty(input.reviewComment ?? "", "reviewComment");
    const reviewedRequest: ModeSwitchRequestDocument = {
      ...input.request,
      status: "rejected",
      reviewedBy: input.reviewerId,
      reviewedAt: now,
      reviewComment,
      updatedAt: now
    };
    return {
      request: reviewedRequest,
      user: input.worker,
      auditLog: auditLog({
        id: `rejectModeSwitchRequest_${input.request.id}_${now.getTime()}`,
        organizationId: input.request.organizationId,
        actorId: input.reviewerId,
        actorRole: input.reviewerRole,
        action: "rejectModeSwitchRequest",
        targetId: input.request.id,
        targetUserId: input.request.userId,
        reason: reviewComment,
        now
      }),
      reportSchedules: []
    };
  }

  if (input.request.desiredEmploymentContext === "general_employment"
    && optionalTrim(input.managerId) === undefined) {
    throw new ModeSwitchError(
      "MANAGER_REQUIRED_FOR_GENERAL_EMPLOYMENT",
      "manager is required for general employment"
    );
  }
  if (input.request.desiredEmploymentContext === "supported_facility"
    && optionalTrim(input.supporterId) === undefined) {
    throw new ModeSwitchError(
      "SUPPORTER_REQUIRED_FOR_SUPPORTED_FACILITY",
      "supporter is required for supported facility"
    );
  }

  const reviewedRequest: ModeSwitchRequestDocument = {
    ...input.request,
    status: "approved",
    managerId: optionalTrim(input.managerId),
    supporterId: optionalTrim(input.supporterId),
    reviewedBy: input.reviewerId,
    reviewedAt: now,
    reviewComment: optionalTrim(input.reviewComment),
    updatedAt: now
  };
  const user: UserDocument = {
    ...input.worker,
    accountMode: "report_support_mode",
    updatedAt: now
  };
  const workerSettings = createWorkerSettings({
    workerId: input.request.userId,
    organizationId: input.request.organizationId,
    employmentContext: input.request.desiredEmploymentContext,
    now
  });
  const assignment = createAssignment({
    workerId: input.request.userId,
    managerId: optionalTrim(input.managerId),
    supporterId: optionalTrim(input.supporterId),
    organizationId: input.request.organizationId,
    reviewerId: input.reviewerId,
    now
  });

  return {
    request: reviewedRequest,
    user,
    workerSettings,
    assignment,
    reportSchedules: migrateReportSchedules({
      request: reviewedRequest,
      reviewerId: input.reviewerId,
      notificationSchedules: input.notificationSchedules,
      now
    }),
    auditLog: auditLog({
      id: `approveModeSwitchRequest_${input.request.id}_${now.getTime()}`,
      organizationId: input.request.organizationId,
      actorId: input.reviewerId,
      actorRole: input.reviewerRole,
      action: "approveModeSwitchRequest",
      targetId: input.request.id,
      targetUserId: input.request.userId,
      reason: input.reviewComment,
      now
    })
  };
}

export function listModeSwitchRequests(input: {
  actorRole: Extract<UserRole, "supporter" | "admin">;
  actorEmail?: string;
  requests: ModeSwitchRequestDocument[];
}): ModeSwitchRequestDocument[] {
  const actorEmail = normalizeEmail(input.actorEmail);
  return [...input.requests]
    .filter((request) => input.actorRole === "admin"
      || request.requestedSupporterEmail === actorEmail)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
