import {
  AuditLogDocument,
  ConsultationThreadDocument,
  NotificationLogDocument,
  ReportDocument,
  ReportReplyDocument,
  UserRole
} from "../domain/firestoreModels";

export class ConsultationThreadError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ConsultationThreadError";
  }
}

export interface CreateConsultationThreadInput {
  report: ReportDocument;
}

export interface CreateReportReplyInput {
  replyId: string;
  thread: ConsultationThreadDocument;
  report: ReportDocument;
  actorId: string;
  actorRole: UserRole;
  body: string;
}

export interface CreateReportReplyResult {
  reply: ReportReplyDocument;
  notificationLogs: NotificationLogDocument[];
}

export interface ConsultationThreadDetail {
  thread: ConsultationThreadDocument;
  report: ReportDocument;
  replies: ReportReplyDocument[];
}

export interface ConfirmReportReplyResult {
  auditLog: AuditLogDocument;
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ConsultationThreadError(`${fieldName.toUpperCase()}_REQUIRED`, `${fieldName} is required`);
  }
  return normalized;
}

function participantIds(report: ReportDocument): string[] {
  return [...new Set([report.workerId, ...report.selectedRecipients])];
}

function assertThreadMatchesReport(thread: ConsultationThreadDocument, report: ReportDocument): void {
  if (thread.reportId !== report.id || thread.workerId !== report.workerId
    || thread.organizationId !== report.organizationId) {
    throw new ConsultationThreadError("CONSULTATION_THREAD_MISMATCH", "thread does not match report");
  }
}

function assertConsultationParticipant(input: {
  thread: ConsultationThreadDocument;
  report: ReportDocument;
  actorId: string;
  actorRole: UserRole;
}): void {
  assertThreadMatchesReport(input.thread, input.report);
  const isWorker = input.actorRole === "worker" && input.actorId === input.report.workerId;
  const isSelectedStaff = (input.actorRole === "manager" || input.actorRole === "supporter")
    && input.report.selectedRecipients.includes(input.actorId);
  if (!isWorker && !isSelectedStaff) {
    throw new ConsultationThreadError("CONSULTATION_ACCESS_DENIED", "consultation access denied");
  }
}

export function createConsultationThreadDocument(
  input: CreateConsultationThreadInput,
  now = new Date()
): ConsultationThreadDocument | undefined {
  if (input.report.reportStatus !== "consultation") {
    return undefined;
  }

  return {
    id: input.report.id,
    reportId: input.report.id,
    workerId: input.report.workerId,
    organizationId: input.report.organizationId,
    status: "open",
    createdAt: now,
    updatedAt: now
  };
}

function createReplyNotificationLog(input: {
  thread: ConsultationThreadDocument;
  recipientId: string;
  channel: "in_app" | "email";
  now: Date;
}): NotificationLogDocument {
  return {
    id: `${input.thread.id}_consultation_reply_${input.recipientId}_${input.channel}_${input.now.getTime()}`,
    userId: input.recipientId,
    eventId: input.thread.id,
    accountMode: "report_support_mode",
    notificationType: "consultation_reply",
    channel: input.channel,
    status: "sent",
    sentAt: input.now,
    createdAt: input.now
  };
}

export function createReportReplyDocuments(
  input: CreateReportReplyInput,
  now = new Date()
): CreateReportReplyResult {
  assertConsultationParticipant(input);
  if (input.thread.status !== "open") {
    throw new ConsultationThreadError("CONSULTATION_THREAD_CLOSED", "consultation thread is closed");
  }

  const body = requireNonEmpty(input.body, "body");
  const reply: ReportReplyDocument = {
    id: requireNonEmpty(input.replyId, "replyId"),
    threadId: input.thread.id,
    reportId: input.report.id,
    senderId: input.actorId,
    senderRole: input.actorRole,
    body,
    createdAt: now
  };
  const notificationLogs = participantIds(input.report)
    .filter((recipientId) => recipientId !== input.actorId)
    .flatMap((recipientId) => [
      createReplyNotificationLog({
        thread: input.thread,
        recipientId,
        channel: "in_app",
        now
      }),
      createReplyNotificationLog({
        thread: input.thread,
        recipientId,
        channel: "email",
        now
      })
    ]);

  return {
    reply,
    notificationLogs
  };
}

export function getConsultationThreadDetail(input: {
  thread: ConsultationThreadDocument;
  report: ReportDocument;
  replies: ReportReplyDocument[];
  actorId: string;
  actorRole: UserRole;
}): ConsultationThreadDetail {
  assertConsultationParticipant(input);
  return {
    thread: input.thread,
    report: input.report,
    replies: [...input.replies].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  };
}

export function closeConsultationThreadDocument(input: {
  thread: ConsultationThreadDocument;
  report: ReportDocument;
  actorId: string;
  actorRole: UserRole;
}, now = new Date()): ConsultationThreadDocument {
  assertConsultationParticipant(input);
  return {
    ...input.thread,
    status: "closed",
    closedBy: input.actorId,
    closedAt: now,
    updatedAt: now
  };
}

export function confirmReportReplyDocument(input: {
  thread: ConsultationThreadDocument;
  report: ReportDocument;
  reply: ReportReplyDocument;
  actorId: string;
  actorRole: UserRole;
}, now = new Date()): ConfirmReportReplyResult {
  assertConsultationParticipant(input);
  if (input.reply.threadId !== input.thread.id || input.reply.reportId !== input.report.id) {
    throw new ConsultationThreadError("REPORT_REPLY_MISMATCH", "reply does not match thread");
  }
  return {
    auditLog: {
      id: `report_reply_confirmed_${input.reply.id}_${input.actorId}_${now.getTime()}`,
      organizationId: input.report.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "report_reply_confirmed",
      targetType: "reportReply",
      targetId: input.reply.id,
      targetUserId: input.report.workerId,
      createdAt: now
    }
  };
}

export function listManagerConsultationThreads(input: {
  managerId: string;
  threads: ConsultationThreadDocument[];
  reports: ReportDocument[];
}): ConsultationThreadDetail[] {
  const reportsById = new Map(input.reports.map((report) => [report.id, report]));
  return input.threads
    .flatMap((thread) => {
      const report = reportsById.get(thread.reportId);
      if (report === undefined || !report.selectedRecipients.includes(input.managerId)) {
        return [];
      }
      return [{
        thread,
        report,
        replies: []
      }];
    })
    .sort((a, b) => b.thread.updatedAt.getTime() - a.thread.updatedAt.getTime());
}
