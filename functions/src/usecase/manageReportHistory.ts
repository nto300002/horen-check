import {
  ReportCorrectionDocument,
  ReportDocument
} from "../domain/firestoreModels";

export interface ListRecentWorkerReportsInput {
  reports: ReportDocument[];
  workerId: string;
  now: Date;
}

export interface CreateReportCorrectionInput {
  id: string;
  report: ReportDocument;
  workerId: string;
  correctedText: string;
  reason: string;
}

export interface CreateReportCorrectionResult {
  correction: ReportCorrectionDocument;
  originalReport: ReportDocument;
}

export interface ListReportCorrectionsInput {
  corrections: ReportCorrectionDocument[];
  reportId: string;
  workerId: string;
}

export class ReportHistoryError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ReportHistoryError";
  }
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ReportHistoryError(`${fieldName.toUpperCase()}_REQUIRED`, `${fieldName} is required`);
  }
  return normalized;
}

function assertOwnReport(report: ReportDocument, workerId: string): void {
  if (report.workerId !== workerId) {
    throw new ReportHistoryError("REPORT_NOT_FOUND", "report was not found");
  }
}

export function listRecentWorkerReports(input: ListRecentWorkerReportsInput): ReportDocument[] {
  const since = new Date(input.now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return input.reports
    .filter((report) => report.workerId === input.workerId
      && report.submittedAt.getTime() >= since.getTime())
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export function createReportCorrectionDocument(
  input: CreateReportCorrectionInput,
  now = new Date()
): CreateReportCorrectionResult {
  assertOwnReport(input.report, input.workerId);
  const correction: ReportCorrectionDocument = {
    id: requireNonEmpty(input.id, "id"),
    reportId: input.report.id,
    workerId: input.workerId,
    organizationId: input.report.organizationId,
    previousText: input.report.editedText,
    correctedText: requireNonEmpty(input.correctedText, "correctedText"),
    reason: requireNonEmpty(input.reason, "reason"),
    submittedAt: now,
    createdAt: now
  };

  return {
    correction,
    originalReport: input.report
  };
}

export function listReportCorrections(
  input: ListReportCorrectionsInput
): ReportCorrectionDocument[] {
  return input.corrections
    .filter((correction) => correction.reportId === input.reportId
      && correction.workerId === input.workerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
