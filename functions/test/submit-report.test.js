const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  retryReportDeliveryDocument,
  submitReportDocuments,
  SubmitReportError
} = require("../lib/usecase/submitReport");

function reportEvent(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "event-1",
    scheduleId: "worker-1_AM_START",
    workerId: "worker-1",
    organizationId: "org-1",
    type: "AM_START",
    dueAt: new Date("2026-07-07T09:00:00.000Z"),
    status: "notified",
    workStyle: "remote",
    employmentContext: "supported_facility",
    notificationCount: 1,
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
    notifyManagerInSupportedFacility: true,
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

function user(id, email) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id,
    name: id,
    email,
    role: id.startsWith("manager") ? "manager" : "supporter",
    accountMode: "report_support_mode",
    organizationId: "org-1",
    active: true,
    createdAt: now,
    updatedAt: now
  };
}

function existingIdempotency(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1_submitReport_idem-1",
    organizationId: "org-1",
    userId: "worker-1",
    apiName: "submitReport",
    key: "idem-1",
    requestHash: "hash-1",
    status: "completed",
    response: {
      reportId: "report-1"
    },
    createdAt: now,
    expiresAt: new Date("2026-07-08T00:00:00.000Z"),
    ...overrides
  };
}

test("submits an AM_START report, stores recipients, deliveries, event status, and audit log", async () => {
  const now = new Date("2026-07-07T09:05:00.000Z");
  const result = await submitReportDocuments({
    reportId: "report-1",
    idempotencyKey: "idem-1",
    requestHash: "hash-1",
    workerId: "worker-1",
    event: reportEvent(),
    workerSettings: workerSettings(),
    assignment: assignment(),
    existingReports: [],
    existingIdempotencyKey: undefined,
    recipientUsersById: {
      "supporter-1": user("supporter-1", "supporter@example.com"),
      "manager-1": user("manager-1", "manager@example.com")
    },
    input: {
      todayPlan: "在庫確認",
      consultation: "優先順位を相談したいです",
      freeText: "午後に確認します",
      editedText: "おはようございます。午前は在庫確認を進めます。",
      workerSelectedRecipients: ["supporter-1", "manager-1"],
      workerExcludedRecipients: []
    },
    deliverySender: async (delivery) => {
      if (delivery.recipientUserId === "manager-1") {
        throw new Error("ses failed");
      }
    }
  }, now);

  assert.equal(result.idempotent, false);
  assert.equal(result.report.id, "report-1");
  assert.equal(result.report.reportStatus, "consultation");
  assert.match(result.generatedText, /本日は在庫確認に取り組みます。/);
  assert.match(result.generatedText, /相談したいこと：優先順位を相談したいです/);
  assert.match(result.generatedText, /補足：午後に確認します/);
  assert.equal(result.report.editedText, "おはようございます。午前は在庫確認を進めます。");
  assert.deepEqual(result.report.selectedRecipients, ["supporter-1", "manager-1"]);
  assert.deepEqual(result.report.excludedRecipients, []);
  assert.equal(result.reportEvent.status, "reported");
  assert.equal(result.deliveries.length, 2);
  assert.equal(result.deliveries.find((item) => item.recipientUserId === "supporter-1").status, "sent");
  assert.equal(result.deliveries.find((item) => item.recipientUserId === "manager-1").status, "failed");
  assert.equal(result.auditLog.action, "report_submitted");
  assert.equal(result.consultationThread.id, "report-1");
  assert.equal(result.consultationThread.status, "open");
  assert.equal(result.idempotencyKey.status, "completed");
  assert.equal(result.idempotencyKey.response.reportId, "report-1");
});

test("generates AM_START report text when worker does not edit it", async () => {
  const result = await submitReportDocuments({
    reportId: "report-1",
    idempotencyKey: "idem-1",
    requestHash: "hash-1",
    workerId: "worker-1",
    event: reportEvent(),
    workerSettings: workerSettings(),
    assignment: assignment(),
    existingReports: [],
    existingIdempotencyKey: undefined,
    recipientUsersById: {
      "supporter-1": user("supporter-1", "supporter@example.com")
    },
    input: {
      todayPlan: "日報作成"
    },
    deliverySender: async () => {}
  }, new Date("2026-07-07T09:05:00.000Z"));

  assert.equal(result.report.reportStatus, "progress");
  assert.equal(result.report.editedText, result.generatedText);
  assert.match(result.report.editedText, /おはようございます。/);
  assert.match(result.report.editedText, /本日は日報作成に取り組みます。/);
});

test("submitReport applies active employment transition recipient policy", async () => {
  const result = await submitReportDocuments({
    reportId: "report-transition",
    idempotencyKey: "idem-transition",
    requestHash: "hash-transition",
    workerId: "worker-1",
    event: reportEvent({
      employmentContext: "general_employment"
    }),
    workerSettings: workerSettings({
      activeTransitionId: "transition-1",
      transitionRecipientPolicy: "manager_and_supporter"
    }),
    assignment: assignment({
      managerId: "old-manager-1",
      supporterId: "old-supporter-1"
    }),
    transition: {
      id: "transition-1",
      status: "active",
      oldManagerId: "old-manager-1",
      newManagerId: "new-manager-1",
      oldSupporterId: "old-supporter-1",
      newSupporterId: "new-supporter-1"
    },
    existingReports: [],
    existingIdempotencyKey: undefined,
    recipientUsersById: {
      "old-manager-1": user("manager-old", "old-manager@example.com"),
      "new-manager-1": user("manager-new", "new-manager@example.com"),
      "old-supporter-1": user("supporter-old", "old-supporter@example.com"),
      "new-supporter-1": user("supporter-new", "new-supporter@example.com")
    },
    input: {
      todayPlan: "移行先の報告確認"
    },
    deliverySender: async () => {}
  }, new Date("2026-07-07T09:05:00.000Z"));

  assert.deepEqual(result.report.selectedRecipients, [
    "old-manager-1",
    "new-manager-1",
    "old-supporter-1",
    "new-supporter-1"
  ]);
});

test("generates AM_END, PM_START, and PM_END report text with required fields", async () => {
  const cases = [
    {
      type: "AM_END",
      input: { completedWork: "午前の在庫確認", consultation: "午後の優先順位を相談したいです", freeText: "10件完了" },
      expected: /午前は午前の在庫確認まで完了しました。/,
      requiredCode: "COMPLETEDWORK_REQUIRED"
    },
    {
      type: "PM_START",
      input: { afternoonPlan: "商品登録", consultation: "確認方法を相談したいです", freeText: "15時に共有します" },
      expected: /午後は商品登録に取り組みます。/,
      requiredCode: "AFTERNOONPLAN_REQUIRED"
    },
    {
      type: "PM_END",
      input: { completedWork: "商品登録と確認", consultation: "明日の進め方を相談したいです", freeText: "残り2件です" },
      expected: /本日は商品登録と確認まで完了しました。/,
      requiredCode: "COMPLETEDWORK_REQUIRED"
    }
  ];

  for (const item of cases) {
    const result = await submitReportDocuments({
      reportId: `report-${item.type}`,
      idempotencyKey: `idem-${item.type}`,
      requestHash: `hash-${item.type}`,
      workerId: "worker-1",
      event: reportEvent({
        id: `event-${item.type}`,
        scheduleId: `worker-1_${item.type}`,
        type: item.type
      }),
      workerSettings: workerSettings(),
      assignment: assignment(),
      existingReports: [],
      existingIdempotencyKey: undefined,
      recipientUsersById: {
        "supporter-1": user("supporter-1", "supporter@example.com")
      },
      input: item.input,
      deliverySender: async () => {}
    }, new Date("2026-07-07T12:05:00.000Z"));

    assert.equal(result.report.type, item.type);
    assert.match(result.generatedText, item.expected);
    assert.match(result.generatedText, /相談したいこと：/);
    assert.match(result.generatedText, /補足：/);

    await assert.rejects(() => submitReportDocuments({
      reportId: `report-missing-${item.type}`,
      idempotencyKey: `idem-missing-${item.type}`,
      requestHash: `hash-missing-${item.type}`,
      workerId: "worker-1",
      event: reportEvent({
        id: `event-missing-${item.type}`,
        scheduleId: `worker-1_${item.type}`,
        type: item.type
      }),
      workerSettings: workerSettings(),
      assignment: assignment(),
      existingReports: [],
      existingIdempotencyKey: undefined,
      recipientUsersById: {
        "supporter-1": user("supporter-1", "supporter@example.com")
      },
      input: {},
      deliverySender: async () => {}
    }), (error) => {
      assert.equal(error instanceof SubmitReportError, true);
      assert.equal(error.code, item.requiredCode);
      return true;
    });
  }
});

test("prevents duplicate submit by idempotencyKey, reportEvent status, and existing report", async () => {
  const baseInput = {
    reportId: "report-1",
    idempotencyKey: "idem-1",
    requestHash: "hash-1",
    workerId: "worker-1",
    event: reportEvent(),
    workerSettings: workerSettings(),
    assignment: assignment(),
    existingReports: [],
    existingIdempotencyKey: undefined,
    recipientUsersById: {
      "supporter-1": user("supporter-1", "supporter@example.com")
    },
    input: {
      todayPlan: "日報作成"
    },
    deliverySender: async () => {}
  };

  const idempotent = await submitReportDocuments({
    ...baseInput,
    existingIdempotencyKey: existingIdempotency()
  });
  assert.equal(idempotent.idempotent, true);
  assert.deepEqual(idempotent.idempotencyKey.response, { reportId: "report-1" });

  await assert.rejects(() => submitReportDocuments({
    ...baseInput,
    event: reportEvent({ status: "reported" })
  }), (error) => {
    assert.equal(error instanceof SubmitReportError, true);
    assert.equal(error.code, "REPORT_ALREADY_SUBMITTED");
    return true;
  });

  await assert.rejects(() => submitReportDocuments({
    ...baseInput,
    existingReports: [{
      id: "report-existing",
      eventId: "event-1",
      workerId: "worker-1",
      organizationId: "org-1",
      type: "AM_START",
      reportStatus: "progress",
      employmentContext: "supported_facility",
      generatedText: "text",
      editedText: "text",
      selectedRecipients: ["supporter-1"],
      excludedRecipients: [],
      submittedAt: new Date("2026-07-07T09:00:00.000Z"),
      createdAt: new Date("2026-07-07T09:00:00.000Z"),
      updatedAt: new Date("2026-07-07T09:00:00.000Z")
    }]
  }), (error) => {
    assert.equal(error instanceof SubmitReportError, true);
    assert.equal(error.code, "REPORT_ALREADY_SUBMITTED");
    return true;
  });
});

test("retryReportDelivery resends a failed delivery and increments retry count", async () => {
  const now = new Date("2026-07-07T09:10:00.000Z");
  const delivery = {
    id: "report-1_supporter-1_email",
    reportId: "report-1",
    workerId: "worker-1",
    recipientUserId: "supporter-1",
    channel: "email",
    destination: "supporter@example.com",
    status: "failed",
    errorMessage: "ses failed",
    retryCount: 1,
    createdAt: new Date("2026-07-07T09:05:00.000Z"),
    updatedAt: new Date("2026-07-07T09:05:00.000Z")
  };

  const resent = await retryReportDeliveryDocument({
    existingDelivery: delivery,
    deliverySender: async () => {}
  }, now);

  assert.equal(resent.status, "sent");
  assert.equal(resent.retryCount, 2);
  assert.equal(resent.sentAt, now);
  assert.equal(Object.hasOwn(resent, "errorMessage"), false);
});
