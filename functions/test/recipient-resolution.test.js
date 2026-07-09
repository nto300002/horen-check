const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  RecipientResolutionError,
  resolveRecipients,
  validateRequiredRecipients
} = require("../lib/usecase/recipientResolution");

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

test("supported_facility defaults to supporter recipient", () => {
  const result = resolveRecipients({
    workerSettings: workerSettings(),
    assignment: assignment(),
    employmentContext: "supported_facility"
  });

  assert.deepEqual(result.initialRecipients, ["supporter-1"]);
  assert.deepEqual(result.allowedRecipients, ["manager-1", "supporter-1"]);
  assert.deepEqual(result.requiredRecipients, ["supporter-1"]);
});

test("supported_facility includes manager when notifyManagerInSupportedFacility is true", () => {
  const result = resolveRecipients({
    workerSettings: workerSettings({
      notifyManagerInSupportedFacility: true
    }),
    assignment: assignment(),
    employmentContext: "supported_facility"
  });

  assert.deepEqual(result.initialRecipients, ["supporter-1", "manager-1"]);
});

test("general_employment defaults to manager recipient", () => {
  const result = resolveRecipients({
    workerSettings: workerSettings(),
    assignment: assignment(),
    employmentContext: "general_employment"
  });

  assert.deepEqual(result.initialRecipients, ["manager-1"]);
  assert.deepEqual(result.requiredRecipients, ["manager-1"]);
});

test("general_employment includes supporter when notifySupporterInGeneralEmployment is true", () => {
  const result = resolveRecipients({
    workerSettings: workerSettings({
      notifySupporterInGeneralEmployment: true
    }),
    assignment: assignment(),
    employmentContext: "general_employment"
  });

  assert.deepEqual(result.initialRecipients, ["manager-1", "supporter-1"]);
});

test("active transition applies transitionRecipientPolicy with old and new staff", () => {
  const result = resolveRecipients({
    workerSettings: workerSettings({
      activeTransitionId: "transition-1",
      transitionRecipientPolicy: "manager_and_supporter"
    }),
    assignment: assignment(),
    employmentContext: "general_employment",
    transition: {
      id: "transition-1",
      status: "active",
      oldManagerId: "old-manager-1",
      newManagerId: "new-manager-1",
      oldSupporterId: "old-supporter-1",
      newSupporterId: "new-supporter-1"
    }
  });

  assert.deepEqual(result.initialRecipients, [
    "old-manager-1",
    "new-manager-1",
    "old-supporter-1",
    "new-supporter-1"
  ]);
  assert.deepEqual(result.requiredRecipients, [
    "old-manager-1",
    "new-manager-1",
    "old-supporter-1",
    "new-supporter-1"
  ]);
});

test("worker can add and exclude recipients within allowed range", () => {
  const result = resolveRecipients({
    workerSettings: workerSettings({
      notifyManagerInSupportedFacility: true
    }),
    assignment: assignment(),
    employmentContext: "supported_facility",
    workerSelectedRecipients: ["supporter-1"],
    workerExcludedRecipients: ["manager-1"]
  });

  assert.deepEqual(result.selectedRecipients, ["supporter-1"]);
  assert.deepEqual(result.excludedRecipients, ["manager-1"]);
});

test("worker cannot add recipients outside allowed range", () => {
  assert.throws(() => resolveRecipients({
    workerSettings: workerSettings(),
    assignment: assignment(),
    employmentContext: "supported_facility",
    workerSelectedRecipients: ["external-user"]
  }), (error) => {
    assert.equal(error instanceof RecipientResolutionError, true);
    assert.equal(error.code, "RECIPIENT_NOT_ALLOWED");
    return true;
  });
});

test("validateRequiredRecipients fails when required recipient is missing", () => {
  const resolved = resolveRecipients({
    workerSettings: workerSettings({
      requiredRecipientPolicy: "manager_and_supporter",
      notifyManagerInSupportedFacility: true
    }),
    assignment: assignment(),
    employmentContext: "supported_facility",
    workerSelectedRecipients: ["supporter-1"],
    workerExcludedRecipients: ["manager-1"]
  });

  assert.throws(() => validateRequiredRecipients(resolved), (error) => {
    assert.equal(error instanceof RecipientResolutionError, true);
    assert.equal(error.code, "REQUIRED_RECIPIENT_MISSING");
    assert.deepEqual(error.missingRecipients, ["manager-1"]);
    return true;
  });
});

test("selectedRecipients and excludedRecipients are normalized for report persistence", () => {
  const resolved = resolveRecipients({
    workerSettings: workerSettings({
      notifyManagerInSupportedFacility: true
    }),
    assignment: assignment(),
    employmentContext: "supported_facility",
    workerSelectedRecipients: ["manager-1", "supporter-1", "supporter-1"],
    workerExcludedRecipients: []
  });

  assert.deepEqual(resolved.reportRecipientFields, {
    selectedRecipients: ["supporter-1", "manager-1"],
    excludedRecipients: []
  });
});
