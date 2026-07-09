import {
  AssignmentDocument,
  AuditLogDocument,
  EmploymentContext,
  EmploymentContextTransitionDocument,
  EmploymentTransitionRequestDocument,
  NotificationLogDocument,
  UserRole,
  WorkerSettingsDocument
} from "../domain/firestoreModels";

export class EmploymentTransitionError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "EmploymentTransitionError";
  }
}

export interface EmploymentTransitionRequestInput {
  id: string;
  workerId: string;
  organizationId: string;
  requestedToContext: EmploymentContext;
  message?: string;
}

export interface StartEmploymentTransitionInput {
  transitionId: string;
  actorId: string;
  actorRole: UserRole;
  workerId: string;
  organizationId: string;
  fromContext: EmploymentContext;
  toContext: EmploymentContext;
  assignment: AssignmentDocument;
  workerSettings: WorkerSettingsDocument;
  transitionStartDate: Date;
  transitionEndDate: Date;
  transitionRecipientPolicy: string;
  newManagerId?: string;
  newSupporterId?: string;
  keepSupporterNotified?: boolean;
  keepManagerNotified?: boolean;
  reason: string;
  initialStatus?: "planned" | "active";
}

export interface EmploymentTransitionDocumentsResult {
  transition: EmploymentContextTransitionDocument;
  workerSettings: WorkerSettingsDocument;
  auditLog: AuditLogDocument;
}

function requireNonEmpty(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim() ?? "";
  if (normalized.length === 0) {
    throw new EmploymentTransitionError(`${fieldName.toUpperCase()}_REQUIRED`, `${fieldName} is required`);
  }
  return normalized;
}

function assertTransitionActor(actorRole: UserRole): void {
  if (actorRole !== "manager" && actorRole !== "supporter" && actorRole !== "admin") {
    throw new EmploymentTransitionError(
      "EMPLOYMENT_TRANSITION_ACTOR_NOT_ALLOWED",
      "manager, supporter, or admin role is required"
    );
  }
}

function assertActiveTransition(transition: EmploymentContextTransitionDocument): void {
  if (transition.status !== "active" && transition.status !== "planned") {
    throw new EmploymentTransitionError(
      "EMPLOYMENT_TRANSITION_NOT_OPEN",
      "transition is not open"
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
  workerId: string;
  afterValue?: Record<string, unknown>;
  now: Date;
}): AuditLogDocument {
  return {
    id: `${input.id}_${input.targetId}_${input.now.getTime()}`,
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    targetType: "employmentContextTransition",
    targetId: input.targetId,
    targetUserId: input.workerId,
    afterValue: input.afterValue,
    createdAt: input.now
  };
}

export function createEmploymentTransitionRequestDocument(
  input: EmploymentTransitionRequestInput,
  now = new Date()
): EmploymentTransitionRequestDocument {
  const workerId = requireNonEmpty(input.workerId, "workerId");
  return {
    id: requireNonEmpty(input.id, "id"),
    workerId,
    organizationId: requireNonEmpty(input.organizationId, "organizationId"),
    requestedBy: workerId,
    requestedToContext: input.requestedToContext,
    message: input.message?.trim() || undefined,
    status: "pending",
    createdAt: now,
    updatedAt: now
  };
}

function buildTransitionDocument(
  input: StartEmploymentTransitionInput,
  now: Date
): EmploymentContextTransitionDocument {
  assertTransitionActor(input.actorRole);
  const reason = requireNonEmpty(input.reason, "reason");
  if (input.assignment.workerId !== input.workerId || !input.assignment.active) {
    throw new EmploymentTransitionError("ASSIGNMENT_INVALID", "active assignment is required");
  }
  if (input.workerSettings.userId !== input.workerId) {
    throw new EmploymentTransitionError("WORKER_SETTINGS_MISMATCH", "worker settings do not match");
  }
  return {
    id: requireNonEmpty(input.transitionId, "transitionId"),
    workerId: requireNonEmpty(input.workerId, "workerId"),
    organizationId: requireNonEmpty(input.organizationId, "organizationId"),
    fromContext: input.fromContext,
    toContext: input.toContext,
    status: input.initialStatus ?? "active",
    transitionStartDate: input.transitionStartDate,
    transitionEndDate: input.transitionEndDate,
    keepSupporterNotified: input.keepSupporterNotified ?? true,
    keepManagerNotified: input.keepManagerNotified ?? true,
    transitionRecipientPolicy: requireNonEmpty(input.transitionRecipientPolicy, "transitionRecipientPolicy"),
    oldManagerId: input.assignment.managerId,
    newManagerId: input.newManagerId,
    oldSupporterId: input.assignment.supporterId,
    newSupporterId: input.newSupporterId,
    createdBy: input.actorId,
    approvedBy: input.actorId,
    reason,
    createdAt: now,
    updatedAt: now
  };
}

export function startEmploymentContextTransitionDocuments(
  input: StartEmploymentTransitionInput,
  now = new Date()
): EmploymentTransitionDocumentsResult {
  const transition = buildTransitionDocument(input, now);
  const workerSettings: WorkerSettingsDocument = {
    ...input.workerSettings,
    activeTransitionId: transition.id,
    transitionRecipientPolicy: transition.transitionRecipientPolicy,
    updatedAt: now
  };
  return {
    transition,
    workerSettings,
    auditLog: auditLog({
      id: "employment_transition_started",
      organizationId: transition.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "employment_transition_started",
      targetId: transition.id,
      workerId: transition.workerId,
      afterValue: {
        fromContext: transition.fromContext,
        toContext: transition.toContext,
        transitionRecipientPolicy: transition.transitionRecipientPolicy
      },
      now
    })
  };
}

export function convertEmploymentTransitionRequestDocuments(
  input: Omit<StartEmploymentTransitionInput, "workerId" | "organizationId" | "fromContext" | "toContext"> & {
    request: EmploymentTransitionRequestDocument;
  },
  now = new Date()
): {
  request: EmploymentTransitionRequestDocument;
  transition: EmploymentContextTransitionDocument;
  auditLog: AuditLogDocument;
} {
  if (input.request.status !== "pending") {
    throw new EmploymentTransitionError("EMPLOYMENT_TRANSITION_REQUEST_NOT_PENDING", "request is not pending");
  }
  const started = startEmploymentContextTransitionDocuments({
    ...input,
    workerId: input.request.workerId,
    organizationId: input.request.organizationId,
    fromContext: input.workerSettings.defaultEmploymentContext,
    toContext: input.request.requestedToContext,
    initialStatus: "planned"
  }, now);
  return {
    request: {
      ...input.request,
      status: "converted",
      convertedBy: input.actorId,
      convertedAt: now,
      convertedTransitionId: started.transition.id,
      updatedAt: now
    },
    transition: started.transition,
    auditLog: started.auditLog
  };
}

export function completeEmploymentContextTransitionDocuments(input: {
  transition: EmploymentContextTransitionDocument;
  workerSettings: WorkerSettingsDocument;
  actorId: string;
  actorRole: UserRole;
  completionReason: string;
}, now = new Date()): EmploymentTransitionDocumentsResult {
  assertTransitionActor(input.actorRole);
  assertActiveTransition(input.transition);
  const completionReason = requireNonEmpty(input.completionReason, "completionReason");
  const transition: EmploymentContextTransitionDocument = {
    ...input.transition,
    status: "completed",
    completedBy: input.actorId,
    completedAt: now,
    completionReason,
    updatedAt: now
  };
  const workerSettings: WorkerSettingsDocument = {
    ...input.workerSettings,
    defaultEmploymentContext: transition.toContext,
    activeTransitionId: undefined,
    updatedAt: now
  };
  return {
    transition,
    workerSettings,
    auditLog: auditLog({
      id: "employment_transition_completed",
      organizationId: transition.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "employment_transition_completed",
      targetId: transition.id,
      workerId: transition.workerId,
      afterValue: { completionReason },
      now
    })
  };
}

export function cancelEmploymentContextTransitionDocument(input: {
  transition: EmploymentContextTransitionDocument;
  actorId: string;
  actorRole: UserRole;
  cancellationReason: string;
}, now = new Date()): EmploymentContextTransitionDocument {
  assertTransitionActor(input.actorRole);
  assertActiveTransition(input.transition);
  return {
    ...input.transition,
    status: "cancelled",
    cancelledBy: input.actorId,
    cancelledAt: now,
    cancellationReason: requireNonEmpty(input.cancellationReason, "cancellationReason"),
    updatedAt: now
  };
}

export function remindTransitionCompletionDocuments(input: {
  transition: EmploymentContextTransitionDocument;
  recipients: string[];
  now: Date;
}): {
  transition: EmploymentContextTransitionDocument;
  notificationLogs: NotificationLogDocument[];
} {
  if (input.transition.status !== "active"
    || input.transition.transitionEndDate.getTime() > input.now.getTime()) {
    return {
      transition: input.transition,
      notificationLogs: []
    };
  }
  return {
    transition: input.transition,
    notificationLogs: [...new Set(input.recipients)].map((recipientId) => ({
      id: `${input.transition.id}_transition_completion_reminder_${recipientId}_${input.now.getTime()}`,
      userId: recipientId,
      eventId: input.transition.id,
      accountMode: "report_support_mode",
      notificationType: "transition_completion_reminder",
      channel: "in_app",
      status: "sent",
      sentAt: input.now,
      createdAt: input.now
    }))
  };
}
