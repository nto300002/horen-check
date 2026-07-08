import {
  AssignmentDocument,
  AuditLogDocument,
  ReportDocument,
  UserDocument
} from "../domain/firestoreModels";

export interface ManagerTodayReportListItem {
  reportId: string;
  workerId: string;
  workerName: string;
  type: string;
  reportStatus: string;
  submittedAt: Date;
  selectedRecipients: string[];
  deliveryStatus: string;
  hasConsultation: boolean;
}

export interface ListManagerTodayReportsInput {
  managerId: string;
  reports: ReportDocument[];
  assignments: AssignmentDocument[];
  workerUsersById: Record<string, UserDocument | undefined>;
  targetDate: Date;
}

export interface ManagerReportDetailInput {
  managerId: string;
  report: ReportDocument;
  assignment: AssignmentDocument;
}

export interface ListSupporterWorkersInput {
  supporterId: string;
  assignments: AssignmentDocument[];
  usersById: Record<string, UserDocument | undefined>;
}

export interface SupporterWorkerReportInput {
  supporterId: string;
  workerId: string;
  reports: ReportDocument[];
  assignment: AssignmentDocument;
  now: Date;
}

export interface AdminReportDetailResult {
  report: ReportDocument;
  auditLog: AuditLogDocument;
}

export class ReportReviewError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ReportReviewError";
  }
}

function isSameUtcDate(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

function assignedWorkerIdsForManager(assignments: AssignmentDocument[], managerId: string): Set<string> {
  return new Set(assignments
    .filter((assignment) => assignment.active && assignment.managerId === managerId)
    .map((assignment) => assignment.workerId));
}

function assertManagerAccess(input: ManagerReportDetailInput): void {
  if (!input.assignment.active || input.assignment.workerId !== input.report.workerId
    || input.assignment.managerId !== input.managerId) {
    throw new ReportReviewError("REPORT_ACCESS_DENIED", "report access denied");
  }
}

function assertSupporterAccess(input: {
  assignment: AssignmentDocument;
  supporterId: string;
  workerId: string;
}): void {
  if (!input.assignment.active || input.assignment.workerId !== input.workerId
    || input.assignment.supporterId !== input.supporterId) {
    throw new ReportReviewError("REPORT_ACCESS_DENIED", "report access denied");
  }
}

export function listManagerTodayReports(
  input: ListManagerTodayReportsInput
): ManagerTodayReportListItem[] {
  const assignedWorkerIds = assignedWorkerIdsForManager(input.assignments, input.managerId);
  return input.reports
    .filter((report) => assignedWorkerIds.has(report.workerId)
      && isSameUtcDate(report.submittedAt, input.targetDate))
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
    .map((report) => ({
      reportId: report.id,
      workerId: report.workerId,
      workerName: input.workerUsersById[report.workerId]?.name ?? report.workerId,
      type: report.type,
      reportStatus: report.reportStatus,
      submittedAt: report.submittedAt,
      selectedRecipients: report.selectedRecipients,
      deliveryStatus: "unknown",
      hasConsultation: report.reportStatus === "consultation"
    }));
}

export function getManagerReportDetail(input: ManagerReportDetailInput): ReportDocument {
  assertManagerAccess(input);
  return input.report;
}

export function listSupporterWorkers(input: ListSupporterWorkersInput): Array<{
  workerId: string;
  workerName: string;
  active: boolean;
}> {
  return input.assignments
    .filter((assignment) => assignment.active && assignment.supporterId === input.supporterId)
    .map((assignment) => ({
      workerId: assignment.workerId,
      workerName: input.usersById[assignment.workerId]?.name ?? assignment.workerId,
      active: assignment.active
    }))
    .sort((a, b) => a.workerName.localeCompare(b.workerName));
}

export function getSupporterWorkerReport(input: SupporterWorkerReportInput): ReportDocument[] {
  assertSupporterAccess({
    assignment: input.assignment,
    supporterId: input.supporterId,
    workerId: input.workerId
  });
  const since = new Date(input.now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return input.reports
    .filter((report) => report.workerId === input.workerId
      && report.submittedAt.getTime() >= since.getTime())
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export function listAdminUsers(input: { users: UserDocument[] }): UserDocument[] {
  return [...input.users].sort((a, b) => a.id.localeCompare(b.id));
}

export function listAuditLogs(input: { auditLogs: AuditLogDocument[] }): AuditLogDocument[] {
  return [...input.auditLogs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getAdminReportDetail(
  input: {
    adminId: string;
    report: ReportDocument;
    reason: string;
  },
  now = new Date()
): AdminReportDetailResult {
  const reason = input.reason.trim();
  if (reason.length === 0) {
    throw new ReportReviewError(
      "REPORT_VIEW_REASON_REQUIRED",
      "reason is required for admin report body view"
    );
  }

  return {
    report: input.report,
    auditLog: {
      id: `report_viewed_${input.report.id}_${now.getTime()}`,
      organizationId: input.report.organizationId,
      actorId: input.adminId,
      actorRole: "admin",
      action: "report_viewed",
      targetType: "report",
      targetId: input.report.id,
      targetUserId: input.report.workerId,
      reason,
      createdAt: now
    }
  };
}
