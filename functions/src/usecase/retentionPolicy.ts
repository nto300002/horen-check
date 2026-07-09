interface DatedDocument {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  submittedAt?: Date;
}

export interface SelectRetentionCandidatesInput {
  now: Date;
  notificationEvents: DatedDocument[];
  notificationLogs: DatedDocument[];
  reports: DatedDocument[];
  reportDeliveries: DatedDocument[];
  auditLogs: DatedDocument[];
  inactiveUsers: DatedDocument[];
}

export interface RetentionCandidates {
  delete: {
    notificationEventIds: string[];
    notificationLogIds: string[];
  };
  anonymize: {
    reportIds: string[];
    reportDeliveryIds: string[];
    inactiveUserIds: string[];
  };
  keep: {
    auditLogIds: string[];
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_RETENTION_DAYS = 30;
const REPORT_RETENTION_DAYS = 180;

function olderThan(reference: Date, candidate: Date | undefined, days: number): boolean {
  if (candidate === undefined) {
    return false;
  }
  return reference.getTime() - candidate.getTime() > days * DAY_MS;
}

function retentionDate(document: DatedDocument): Date | undefined {
  return document.submittedAt ?? document.createdAt ?? document.updatedAt;
}

export function selectRetentionCandidates(input: SelectRetentionCandidatesInput): RetentionCandidates {
  return {
    delete: {
      notificationEventIds: input.notificationEvents
        .filter((document) => olderThan(input.now, retentionDate(document), NOTIFICATION_RETENTION_DAYS))
        .map((document) => document.id),
      notificationLogIds: input.notificationLogs
        .filter((document) => olderThan(input.now, retentionDate(document), NOTIFICATION_RETENTION_DAYS))
        .map((document) => document.id)
    },
    anonymize: {
      reportIds: input.reports
        .filter((document) => olderThan(input.now, retentionDate(document), REPORT_RETENTION_DAYS))
        .map((document) => document.id),
      reportDeliveryIds: input.reportDeliveries
        .filter((document) => olderThan(input.now, retentionDate(document), REPORT_RETENTION_DAYS))
        .map((document) => document.id),
      inactiveUserIds: input.inactiveUsers
        .filter((document) => olderThan(input.now, retentionDate(document), REPORT_RETENTION_DAYS))
        .map((document) => document.id)
    },
    keep: {
      auditLogIds: input.auditLogs.map((document) => document.id)
    }
  };
}
