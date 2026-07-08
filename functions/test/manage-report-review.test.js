const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  getAdminReportDetail,
  getManagerReportDetail,
  getSupporterWorkerReport,
  listAdminUsers,
  listAuditLogs,
  listManagerTodayReports,
  listSupporterWorkers,
  ReportReviewError
} = require("../lib/usecase/manageReportReview");

function report(overrides = {}) {
  const now = new Date("2026-07-07T09:05:00.000Z");
  return {
    id: "report-1",
    eventId: "event-1",
    workerId: "worker-1",
    organizationId: "org-1",
    type: "AM_START",
    reportStatus: "consultation",
    employmentContext: "supported_facility",
    generatedText: "generated body",
    editedText: "sensitive report body",
    selectedRecipients: ["supporter-1", "manager-1"],
    excludedRecipients: [],
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function assignment(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1",
    workerId: "worker-1",
    managerId: "manager-1",
    supporterId: "supporter-1",
    organizationId: "org-1",
    active: true,
    createdBy: "admin-1",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function user(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1",
    name: "Worker One",
    email: "worker@example.com",
    role: "worker",
    accountMode: "report_support_mode",
    organizationId: "org-1",
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function auditLog(overrides = {}) {
  return {
    id: "audit-1",
    organizationId: "org-1",
    actorId: "admin-1",
    actorRole: "admin",
    action: "report_submitted",
    targetType: "report",
    targetId: "report-1",
    createdAt: new Date("2026-07-07T09:05:00.000Z"),
    ...overrides
  };
}

test("manager today list includes assigned worker reports but not report body", () => {
  const items = listManagerTodayReports({
    managerId: "manager-1",
    reports: [
      report(),
      report({ id: "other", workerId: "worker-2" })
    ],
    assignments: [assignment()],
    workerUsersById: {
      "worker-1": user()
    },
    targetDate: new Date("2026-07-07T00:00:00.000Z")
  });

  assert.equal(items.length, 1);
  assert.equal(items[0].reportId, "report-1");
  assert.equal(items[0].workerName, "Worker One");
  assert.equal(Object.hasOwn(items[0], "editedText"), false);
  assert.equal(Object.hasOwn(items[0], "generatedText"), false);
});

test("manager report detail returns body only for assigned worker", () => {
  const detail = getManagerReportDetail({
    managerId: "manager-1",
    report: report(),
    assignment: assignment()
  });

  assert.equal(detail.editedText, "sensitive report body");

  assert.throws(() => getManagerReportDetail({
    managerId: "manager-2",
    report: report(),
    assignment: assignment()
  }), (error) => {
    assert.equal(error instanceof ReportReviewError, true);
    assert.equal(error.code, "REPORT_ACCESS_DENIED");
    return true;
  });
});

test("supporter lists assigned workers and can view worker reports from last 90 days", () => {
  const workers = listSupporterWorkers({
    supporterId: "supporter-1",
    assignments: [assignment()],
    usersById: {
      "worker-1": user()
    }
  });

  assert.deepEqual(workers.map((item) => item.workerId), ["worker-1"]);

  const reports = getSupporterWorkerReport({
    supporterId: "supporter-1",
    workerId: "worker-1",
    reports: [
      report({ id: "recent" }),
      report({ id: "old", submittedAt: new Date("2026-04-08T23:59:59.000Z") })
    ],
    assignment: assignment(),
    now: new Date("2026-07-08T00:00:00.000Z")
  });

  assert.deepEqual(reports.map((item) => item.id), ["recent"]);
  assert.equal(reports[0].editedText, "sensitive report body");
});

test("admin can list users and audit logs", () => {
  assert.deepEqual(listAdminUsers({
    users: [user({ id: "worker-2" }), user()]
  }).map((item) => item.id), ["worker-1", "worker-2"]);

  assert.deepEqual(listAuditLogs({
    auditLogs: [auditLog({ id: "older" }), auditLog({ id: "newer", createdAt: new Date("2026-07-07T10:00:00.000Z") })]
  }).map((item) => item.id), ["newer", "older"]);
});

test("admin report detail requires reason and creates report_viewed audit log", () => {
  const result = getAdminReportDetail({
    adminId: "admin-1",
    report: report(),
    reason: "支援記録確認"
  }, new Date("2026-07-07T10:00:00.000Z"));

  assert.equal(result.report.editedText, "sensitive report body");
  assert.equal(result.auditLog.action, "report_viewed");
  assert.equal(result.auditLog.reason, "支援記録確認");

  assert.throws(() => getAdminReportDetail({
    adminId: "admin-1",
    report: report(),
    reason: " "
  }), (error) => {
    assert.equal(error instanceof ReportReviewError, true);
    assert.equal(error.code, "REPORT_VIEW_REASON_REQUIRED");
    return true;
  });
});
