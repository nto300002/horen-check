const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  cancelModeSwitchRequestDocument,
  createModeSwitchRequestDocument,
  listModeSwitchRequests,
  reviewModeSwitchRequestDocuments,
  ModeSwitchError
} = require("../lib/usecase/manageModeSwitch");

function user(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1",
    name: "Worker One",
    email: "worker@example.com",
    role: "worker",
    accountMode: "notification_mode",
    organizationId: "org-1",
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function request(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "switch-1",
    userId: "worker-1",
    fromMode: "notification_mode",
    toMode: "report_support_mode",
    requestMethod: "supporter_email",
    organizationId: "org-1",
    requestedBy: "worker-1",
    requestedSupporterEmail: "supporter@example.com",
    desiredEmploymentContext: "supported_facility",
    message: "報告支援を使いたいです",
    inheritNotificationSchedules: true,
    scheduleMigrationPolicy: "convert_am_pm",
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function notificationSchedule(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "notification-AM_START",
    userId: "worker-1",
    title: "AM開始報告の時間です",
    type: "AM_START",
    time: "09:00",
    dayOfWeek: [1, 2, 3, 4, 5],
    enabled: true,
    snoozeMinutes: 5,
    repeatIntervalMinutes: 10,
    repeatLimitCount: 3,
    mailFallbackEnabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("creates a pending supporter-email mode switch request and blocks duplicate pending requests", () => {
  const result = createModeSwitchRequestDocument({
    id: "switch-1",
    worker: user(),
    requestMethod: "supporter_email",
    requestedSupporterEmail: " Supporter@Example.com ",
    desiredEmploymentContext: "supported_facility",
    message: " 報告支援を使いたいです ",
    inheritNotificationSchedules: true,
    scheduleMigrationPolicy: "convert_am_pm",
    existingRequests: []
  }, new Date("2026-07-07T10:00:00.000Z"));

  assert.equal(result.request.status, "pending");
  assert.equal(result.request.requestedSupporterEmail, "supporter@example.com");
  assert.equal(result.request.message, "報告支援を使いたいです");

  assert.throws(() => createModeSwitchRequestDocument({
    id: "switch-2",
    worker: user(),
    requestMethod: "supporter_email",
    requestedSupporterEmail: "supporter@example.com",
    desiredEmploymentContext: "supported_facility",
    inheritNotificationSchedules: true,
    scheduleMigrationPolicy: "convert_am_pm",
    existingRequests: [result.request]
  }), (error) => {
    assert.equal(error instanceof ModeSwitchError, true);
    assert.equal(error.code, "PENDING_MODE_SWITCH_EXISTS");
    return true;
  });
});

test("allows re-request after cancellation", () => {
  const cancelled = cancelModeSwitchRequestDocument({
    request: request(),
    workerId: "worker-1"
  }, new Date("2026-07-07T11:00:00.000Z"));

  assert.equal(cancelled.status, "cancelled");

  const next = createModeSwitchRequestDocument({
    id: "switch-2",
    worker: user(),
    requestMethod: "supporter_email",
    requestedSupporterEmail: "supporter@example.com",
    desiredEmploymentContext: "supported_facility",
    inheritNotificationSchedules: true,
    scheduleMigrationPolicy: "convert_am_pm",
    existingRequests: [cancelled]
  });

  assert.equal(next.request.id, "switch-2");
});

test("requires manager for general employment and supporter for supported facility approval", () => {
  assert.throws(() => reviewModeSwitchRequestDocuments({
    request: request({ desiredEmploymentContext: "general_employment" }),
    worker: user(),
    reviewerId: "admin-1",
    reviewerRole: "admin",
    decision: "approved",
    managerId: undefined,
    supporterId: "supporter-1",
    notificationSchedules: []
  }), (error) => {
    assert.equal(error instanceof ModeSwitchError, true);
    assert.equal(error.code, "MANAGER_REQUIRED_FOR_GENERAL_EMPLOYMENT");
    return true;
  });

  assert.throws(() => reviewModeSwitchRequestDocuments({
    request: request({ desiredEmploymentContext: "supported_facility" }),
    worker: user(),
    reviewerId: "admin-1",
    reviewerRole: "admin",
    decision: "approved",
    managerId: "manager-1",
    supporterId: undefined,
    notificationSchedules: []
  }), (error) => {
    assert.equal(error instanceof ModeSwitchError, true);
    assert.equal(error.code, "SUPPORTER_REQUIRED_FOR_SUPPORTED_FACILITY");
    return true;
  });
});

test("approval updates account mode, worker settings, assignment, audit log, and migrated report schedules", () => {
  const result = reviewModeSwitchRequestDocuments({
    request: request(),
    worker: user(),
    reviewerId: "supporter-1",
    reviewerRole: "supporter",
    decision: "approved",
    managerId: "manager-1",
    supporterId: "supporter-1",
    notificationSchedules: [
      notificationSchedule(),
      notificationSchedule({ id: "notification-PM_END", type: "PM_END", time: "17:00" }),
      notificationSchedule({ id: "notification-CUSTOM", type: "CUSTOM", time: "10:30" })
    ]
  }, new Date("2026-07-07T12:00:00.000Z"));

  assert.equal(result.request.status, "approved");
  assert.equal(result.user.accountMode, "report_support_mode");
  assert.equal(result.workerSettings.defaultEmploymentContext, "supported_facility");
  assert.equal(result.assignment.supporterId, "supporter-1");
  assert.deepEqual(result.reportSchedules.map((schedule) => schedule.type), ["AM_START", "PM_END"]);
  assert.equal(result.auditLog.action, "approveModeSwitchRequest");
});

test("rejection stores review comment and leaves worker mode unchanged", () => {
  const result = reviewModeSwitchRequestDocuments({
    request: request(),
    worker: user(),
    reviewerId: "admin-1",
    reviewerRole: "admin",
    decision: "rejected",
    reviewComment: "担当者確認後に再申請してください",
    notificationSchedules: []
  }, new Date("2026-07-07T12:00:00.000Z"));

  assert.equal(result.request.status, "rejected");
  assert.equal(result.request.reviewComment, "担当者確認後に再申請してください");
  assert.equal(result.user.accountMode, "notification_mode");
  assert.equal(result.auditLog.action, "rejectModeSwitchRequest");
});

test("supporter sees requested email matches and admin sees all requests", () => {
  const requests = [
    request({ id: "switch-1", requestedSupporterEmail: "supporter@example.com" }),
    request({ id: "switch-2", requestedSupporterEmail: "other@example.com" })
  ];

  assert.deepEqual(listModeSwitchRequests({
    actorRole: "supporter",
    actorEmail: "supporter@example.com",
    requests
  }).map((item) => item.id), ["switch-1"]);

  assert.deepEqual(listModeSwitchRequests({
    actorRole: "admin",
    requests
  }).map((item) => item.id), ["switch-1", "switch-2"]);
});
