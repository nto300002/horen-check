import {
  AssignmentDocument,
  AuditLogDocument,
  ConsultationThreadDocument,
  IdempotencyKeyDocument,
  ReportDeliveryDocument,
  ReportDocument,
  ReportEventDocument,
  ReportType,
  UserDocument,
  WorkerSettingsDocument
} from "../domain/firestoreModels";
import {
  resolveRecipients,
  validateRequiredRecipients
} from "./recipientResolution";
import { createConsultationThreadDocument } from "./manageConsultationThread";

export class SubmitReportError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "SubmitReportError";
  }
}

export interface SubmitReportBodyInput {
  todayPlan?: string;
  completedWork?: string;
  afternoonPlan?: string;
  consultation?: string;
  freeText?: string;
  editedText?: string;
  workerSelectedRecipients?: string[];
  workerExcludedRecipients?: string[];
}

export interface SubmitReportInput {
  reportId: string;
  idempotencyKey: string;
  requestHash: string;
  workerId: string;
  event: ReportEventDocument;
  workerSettings: WorkerSettingsDocument;
  assignment: AssignmentDocument;
  existingReports: ReportDocument[];
  existingIdempotencyKey?: IdempotencyKeyDocument;
  recipientUsersById: Record<string, UserDocument | undefined>;
  input: SubmitReportBodyInput;
  deliverySender: (delivery: ReportDeliveryDocument) => Promise<void>;
}

export interface SubmitReportResult {
  idempotent: boolean;
  generatedText?: string;
  report?: ReportDocument;
  reportEvent?: ReportEventDocument;
  consultationThread?: ConsultationThreadDocument;
  deliveries: ReportDeliveryDocument[];
  auditLog?: AuditLogDocument;
  idempotencyKey: IdempotencyKeyDocument;
}

export interface RetryReportDeliveryInput {
  existingDelivery: ReportDeliveryDocument;
  deliverySender: (delivery: ReportDeliveryDocument) => Promise<void>;
}

function requireNonEmpty(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim() ?? "";
  if (normalized.length === 0) {
    throw new SubmitReportError(`${fieldName.toUpperCase()}_REQUIRED`, `${fieldName} is required`);
  }
  return normalized;
}

function appendCommonLines(lines: string[], input: SubmitReportBodyInput): string[] {
  const consultation = input.consultation?.trim();
  const freeText = input.freeText?.trim();
  if (consultation !== undefined && consultation.length > 0) {
    lines.push(`相談したいこと：${consultation}`);
  }
  if (freeText !== undefined && freeText.length > 0) {
    lines.push(`補足：${freeText}`);
  }
  return lines;
}

function generateReportText(type: ReportType, input: SubmitReportBodyInput): string {
  if (type === "AM_START") {
    const todayPlan = requireNonEmpty(input.todayPlan, "todayPlan");
    return appendCommonLines([
      "おはようございます。",
      "これから午前の作業を開始します。",
      `本日は${todayPlan}に取り組みます。`
    ], input).join("\n");
  }

  if (type === "AM_END") {
    const completedWork = requireNonEmpty(input.completedWork, "completedWork");
    return appendCommonLines([
      "お疲れさまです。",
      "午前の作業を終了します。",
      `午前は${completedWork}まで完了しました。`
    ], input).join("\n");
  }

  if (type === "PM_START") {
    const afternoonPlan = requireNonEmpty(input.afternoonPlan, "afternoonPlan");
    return appendCommonLines([
      "お疲れさまです。",
      "これから午後の作業を開始します。",
      `午後は${afternoonPlan}に取り組みます。`
    ], input).join("\n");
  }

  const completedWork = requireNonEmpty(input.completedWork, "completedWork");
  return appendCommonLines([
    "お疲れさまです。",
    "本日の作業を終了します。",
    `本日は${completedWork}まで完了しました。`
  ], input).join("\n");
}

function assertSubmittable(input: SubmitReportInput): void {
  if (input.event.workerId !== input.workerId) {
    throw new SubmitReportError("REPORT_EVENT_WORKER_MISMATCH", "report event worker does not match");
  }
  if (input.event.status === "reported" || input.event.status === "cancelled") {
    throw new SubmitReportError("REPORT_ALREADY_SUBMITTED", "report was already submitted");
  }
  if (input.existingReports.some((report) => report.eventId === input.event.id)) {
    throw new SubmitReportError("REPORT_ALREADY_SUBMITTED", "report already exists for event");
  }
}

function idempotencyDocument(input: SubmitReportInput, now: Date): IdempotencyKeyDocument {
  return {
    id: `${input.workerId}_submitReport_${input.idempotencyKey}`,
    organizationId: input.event.organizationId,
    userId: input.workerId,
    apiName: "submitReport",
    key: input.idempotencyKey,
    requestHash: input.requestHash,
    status: "completed",
    response: {
      reportId: input.reportId,
      eventId: input.event.id
    },
    createdAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
  };
}

function auditLog(report: ReportDocument, now: Date): AuditLogDocument {
  return {
    id: `report_submitted_${report.id}_${now.getTime()}`,
    organizationId: report.organizationId,
    actorId: report.workerId,
    actorRole: "worker",
    action: "report_submitted",
    targetType: "report",
    targetId: report.id,
    targetUserId: report.workerId,
    afterValue: {
      eventId: report.eventId,
      type: report.type,
      selectedRecipients: report.selectedRecipients
    },
    createdAt: now
  };
}

function initialDelivery(input: {
  report: ReportDocument;
  recipientUser: UserDocument;
  now: Date;
}): ReportDeliveryDocument {
  return {
    id: `${input.report.id}_${input.recipientUser.id}_email`,
    reportId: input.report.id,
    workerId: input.report.workerId,
    recipientUserId: input.recipientUser.id,
    channel: "email",
    destination: input.recipientUser.email,
    status: "pending",
    retryCount: 0,
    createdAt: input.now,
    updatedAt: input.now
  };
}

async function sendDelivery(
  delivery: ReportDeliveryDocument,
  sender: (delivery: ReportDeliveryDocument) => Promise<void>,
  now: Date
): Promise<ReportDeliveryDocument> {
  try {
    await sender(delivery);
    return {
      ...delivery,
      status: "sent",
      sentAt: now,
      updatedAt: now
    };
  } catch (error) {
    return {
      ...delivery,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "delivery failed",
      updatedAt: now
    };
  }
}

export async function submitReportDocuments(
  input: SubmitReportInput,
  now = new Date()
): Promise<SubmitReportResult> {
  if (input.existingIdempotencyKey !== undefined) {
    if (input.existingIdempotencyKey.status === "completed") {
      return {
        idempotent: true,
        deliveries: [],
        idempotencyKey: input.existingIdempotencyKey
      };
    }
    throw new SubmitReportError("IDEMPOTENCY_KEY_IN_PROGRESS", "idempotency key is not completed");
  }

  assertSubmittable(input);
  const generatedText = generateReportText(input.event.type, input.input);
  const editedText = input.input.editedText?.trim() || generatedText;
  const recipients = resolveRecipients({
    workerSettings: input.workerSettings,
    assignment: input.assignment,
    employmentContext: input.event.employmentContext,
    workerSelectedRecipients: input.input.workerSelectedRecipients,
    workerExcludedRecipients: input.input.workerExcludedRecipients
  });
  validateRequiredRecipients(recipients);

  const report: ReportDocument = {
    id: requireNonEmpty(input.reportId, "reportId"),
    eventId: input.event.id,
    workerId: input.workerId,
    organizationId: input.event.organizationId,
    type: input.event.type,
    reportStatus: input.input.consultation?.trim() ? "consultation" : "progress",
    employmentContext: input.event.employmentContext,
    generatedText,
    editedText,
    selectedRecipients: recipients.reportRecipientFields.selectedRecipients,
    excludedRecipients: recipients.reportRecipientFields.excludedRecipients,
    submittedAt: now,
    createdAt: now,
    updatedAt: now
  };

  const deliveries = await Promise.all(report.selectedRecipients.map((recipientId) => {
    const recipientUser = input.recipientUsersById[recipientId];
    if (recipientUser === undefined) {
      return Promise.resolve({
        id: `${report.id}_${recipientId}_email`,
        reportId: report.id,
        workerId: report.workerId,
        recipientUserId: recipientId,
        channel: "email" as const,
        destination: "",
        status: "failed" as const,
        errorMessage: "recipient user was not found",
        retryCount: 0,
        createdAt: now,
        updatedAt: now
      });
    }
    return sendDelivery(initialDelivery({ report, recipientUser, now }), input.deliverySender, now);
  }));

  const reportEvent: ReportEventDocument = {
    ...input.event,
    status: "reported",
    updatedAt: now
  };

  return {
    idempotent: false,
    generatedText,
    report,
    reportEvent,
    consultationThread: createConsultationThreadDocument({ report }, now),
    deliveries,
    auditLog: auditLog(report, now),
    idempotencyKey: idempotencyDocument(input, now)
  };
}

export async function retryReportDeliveryDocument(
  input: RetryReportDeliveryInput,
  now = new Date()
): Promise<ReportDeliveryDocument> {
  const retrying: ReportDeliveryDocument = {
    ...input.existingDelivery,
    retryCount: input.existingDelivery.retryCount + 1,
    updatedAt: now
  };
  const sent = await sendDelivery(retrying, input.deliverySender, now);
  if (sent.status === "sent") {
    const { errorMessage: _errorMessage, ...withoutError } = sent;
    return withoutError;
  }
  return sent;
}
