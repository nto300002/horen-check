const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createReportCorrectionDocument,
  listRecentWorkerReports,
  listReportCorrections
} = require("../lib/usecase/manageReportHistory");

function report(overrides = {}) {
  const submittedAt = new Date("2026-07-07T09:05:00.000Z");
  return {
    id: "report-1",
    eventId: "event-1",
    workerId: "worker-1",
    organizationId: "org-1",
    type: "AM_START",
    reportStatus: "progress",
    employmentContext: "supported_facility",
    generatedText: "generated",
    editedText: "original report body",
    selectedRecipients: ["supporter-1"],
    excludedRecipients: [],
    submittedAt,
    createdAt: submittedAt,
    updatedAt: submittedAt,
    ...overrides
  };
}

function correction(overrides = {}) {
  const createdAt = new Date("2026-07-07T10:00:00.000Z");
  return {
    id: "correction-1",
    reportId: "report-1",
    workerId: "worker-1",
    organizationId: "org-1",
    previousText: "original report body",
    correctedText: "corrected report body",
    reason: "誤字修正",
    submittedAt: createdAt,
    createdAt,
    ...overrides
  };
}

test("lists worker reports from the last 90 days in submitted order", () => {
  const reports = listRecentWorkerReports({
    reports: [
      report({ id: "old", submittedAt: new Date("2026-04-08T23:59:59.000Z") }),
      report({ id: "recent-1", submittedAt: new Date("2026-04-09T00:00:00.000Z") }),
      report({ id: "recent-2", submittedAt: new Date("2026-07-07T09:05:00.000Z") }),
      report({ id: "other-worker", workerId: "worker-2" })
    ],
    workerId: "worker-1",
    now: new Date("2026-07-08T00:00:00.000Z")
  });

  assert.deepEqual(reports.map((item) => item.id), ["recent-2", "recent-1"]);
});

test("creates a report correction without mutating the original report body", () => {
  const original = report();
  const result = createReportCorrectionDocument({
    id: "correction-1",
    report: original,
    workerId: "worker-1",
    correctedText: "corrected report body",
    reason: "誤字修正"
  }, new Date("2026-07-07T10:00:00.000Z"));

  assert.equal(result.correction.previousText, "original report body");
  assert.equal(result.correction.correctedText, "corrected report body");
  assert.equal(result.correction.reason, "誤字修正");
  assert.equal(result.originalReport.editedText, "original report body");
});

test("lists corrections for a report in newest order", () => {
  const corrections = listReportCorrections({
    corrections: [
      correction({ id: "older", createdAt: new Date("2026-07-07T10:00:00.000Z") }),
      correction({ id: "newer", createdAt: new Date("2026-07-07T11:00:00.000Z") }),
      correction({ id: "other", reportId: "report-2" })
    ],
    reportId: "report-1",
    workerId: "worker-1"
  });

  assert.deepEqual(corrections.map((item) => item.id), ["newer", "older"]);
});
