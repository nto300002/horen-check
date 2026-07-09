const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  cancelEmploymentContextTransitionDocument,
  completeEmploymentContextTransitionDocuments,
  convertEmploymentTransitionRequestDocuments,
  createEmploymentTransitionRequestDocument,
  EmploymentTransitionError,
  remindTransitionCompletionDocuments,
  startEmploymentContextTransitionDocuments
} = require("../lib/usecase/manageEmploymentTransition");

function assignment(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1",
    workerId: "worker-1",
    managerId: "old-manager-1",
    supporterId: "old-supporter-1",
    organizationId: "org-1",
    active: true,
    createdBy: "admin-1",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function workerSettings(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    userId: "worker-1",
    organizationId: "org-1",
    defaultEmploymentContext: "supported_facility",
    allowWorkerSelectRecipients: true,
    requiredRecipientPolicy: "initial_recipients",
    consultationRequiredRecipientPolicy: "initial_recipients",
    transitionRecipientPolicy: "manager_and_supporter",
    notifySupporterInGeneralEmployment: false,
    notifyManagerInSupportedFacility: false,
    missedVisibilityPolicy: "assigned_staff",
    soundEnabled: true,
    snoozeMinutes: 5,
    localDraftEnabled: true,
    displayPreferences: {},
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function transition(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "transition-1",
    workerId: "worker-1",
    organizationId: "org-1",
    fromContext: "supported_facility",
    toContext: "general_employment",
    status: "active",
    transitionStartDate: new Date("2026-07-07T00:00:00.000Z"),
    transitionEndDate: new Date("2026-07-14T00:00:00.000Z"),
    keepSupporterNotified: true,
    keepManagerNotified: true,
    transitionRecipientPolicy: "manager_and_supporter",
    oldManagerId: "old-manager-1",
    newManagerId: "new-manager-1",
    oldSupporterId: "old-supporter-1",
    newSupporterId: "new-supporter-1",
    createdBy: "supporter-1",
    approvedBy: "supporter-1",
    reason: "一般就労先への移行",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("worker can create a general employment transition request", () => {
  const now = new Date("2026-07-07T09:00:00.000Z");
  const request = createEmploymentTransitionRequestDocument({
    id: "request-1",
    workerId: "worker-1",
    organizationId: "org-1",
    requestedToContext: "general_employment",
    message: "一般就労先でも報連相を安定させたいです"
  }, now);

  assert.equal(request.id, "request-1");
  assert.equal(request.status, "pending");
  assert.equal(request.requestedBy, "worker-1");
  assert.equal(request.requestedToContext, "general_employment");
  assert.equal(request.createdAt, now);
});

test("supporter or admin can convert a request into a planned transition", () => {
  const now = new Date("2026-07-07T10:00:00.000Z");
  const request = createEmploymentTransitionRequestDocument({
    id: "request-1",
    workerId: "worker-1",
    organizationId: "org-1",
    requestedToContext: "general_employment",
    message: "一般就労先でも報連相を安定させたいです"
  });
  const result = convertEmploymentTransitionRequestDocuments({
    request,
    transitionId: "transition-1",
    actorId: "supporter-1",
    actorRole: "supporter",
    assignment: assignment(),
    workerSettings: workerSettings(),
    transitionStartDate: new Date("2026-07-08T00:00:00.000Z"),
    transitionEndDate: new Date("2026-08-08T00:00:00.000Z"),
    transitionRecipientPolicy: "manager_and_supporter",
    newManagerId: "new-manager-1",
    newSupporterId: "new-supporter-1",
    reason: "一般就労先への移行"
  }, now);

  assert.equal(result.request.status, "converted");
  assert.equal(result.request.convertedTransitionId, "transition-1");
  assert.equal(result.transition.status, "planned");
  assert.equal(result.transition.oldManagerId, "old-manager-1");
  assert.equal(result.transition.newManagerId, "new-manager-1");
  assert.equal(result.transition.oldSupporterId, "old-supporter-1");
  assert.equal(result.transition.newSupporterId, "new-supporter-1");
});

test("manager, supporter, or admin can start a transition without a worker request", () => {
  const now = new Date("2026-07-07T10:00:00.000Z");
  const result = startEmploymentContextTransitionDocuments({
    transitionId: "transition-1",
    actorId: "manager-1",
    actorRole: "manager",
    workerId: "worker-1",
    organizationId: "org-1",
    fromContext: "supported_facility",
    toContext: "general_employment",
    assignment: assignment(),
    workerSettings: workerSettings(),
    transitionStartDate: new Date("2026-07-07T00:00:00.000Z"),
    transitionEndDate: new Date("2026-08-07T00:00:00.000Z"),
    transitionRecipientPolicy: "manager_and_supporter",
    newManagerId: "new-manager-1",
    newSupporterId: "new-supporter-1",
    reason: "一般就労先への移行"
  }, now);

  assert.equal(result.transition.status, "active");
  assert.equal(result.workerSettings.activeTransitionId, "transition-1");
  assert.equal(result.workerSettings.transitionRecipientPolicy, "manager_and_supporter");
});

test("transitionEndDate does not auto-complete active transitions", () => {
  const result = remindTransitionCompletionDocuments({
    transition: transition({
      transitionEndDate: new Date("2026-07-01T00:00:00.000Z")
    }),
    recipients: ["old-supporter-1", "new-manager-1"],
    now: new Date("2026-07-09T00:00:00.000Z")
  });

  assert.equal(result.transition.status, "active");
  assert.deepEqual(result.notificationLogs.map((log) => log.userId), ["old-supporter-1", "new-manager-1"]);
  assert.equal(result.notificationLogs.every((log) => log.notificationType === "transition_completion_reminder"), true);
});

test("manual completion and cancellation store reasons", () => {
  const completed = completeEmploymentContextTransitionDocuments({
    transition: transition(),
    workerSettings: workerSettings({ activeTransitionId: "transition-1" }),
    actorId: "supporter-1",
    actorRole: "supporter",
    completionReason: "一般就労先で報告が安定したため"
  }, new Date("2026-07-20T00:00:00.000Z"));

  assert.equal(completed.transition.status, "completed");
  assert.equal(completed.transition.completionReason, "一般就労先で報告が安定したため");
  assert.equal(completed.workerSettings.defaultEmploymentContext, "general_employment");
  assert.equal(completed.workerSettings.activeTransitionId, undefined);

  const cancelled = cancelEmploymentContextTransitionDocument({
    transition: transition(),
    actorId: "admin-1",
    actorRole: "admin",
    cancellationReason: "就労開始日が延期になったため"
  }, new Date("2026-07-10T00:00:00.000Z"));

  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.cancellationReason, "就労開始日が延期になったため");
});

test("worker cannot start, complete, or cancel formal transitions", () => {
  assert.throws(() => startEmploymentContextTransitionDocuments({
    transitionId: "transition-1",
    actorId: "worker-1",
    actorRole: "worker",
    workerId: "worker-1",
    organizationId: "org-1",
    fromContext: "supported_facility",
    toContext: "general_employment",
    assignment: assignment(),
    workerSettings: workerSettings(),
    transitionStartDate: new Date("2026-07-07T00:00:00.000Z"),
    transitionEndDate: new Date("2026-08-07T00:00:00.000Z"),
    transitionRecipientPolicy: "manager_and_supporter",
    reason: "一般就労先への移行"
  }), (error) => {
    assert.equal(error instanceof EmploymentTransitionError, true);
    assert.equal(error.code, "EMPLOYMENT_TRANSITION_ACTOR_NOT_ALLOWED");
    return true;
  });
});
