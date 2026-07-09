const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  closeConsultationThreadDocument,
  ConsultationThreadError,
  confirmReportReplyDocument,
  createConsultationThreadDocument,
  createReportReplyDocuments,
  getConsultationThreadDetail,
  listManagerConsultationThreads
} = require("../lib/usecase/manageConsultationThread");

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
    editedText: "相談したいこと：優先順位を相談したいです",
    selectedRecipients: ["supporter-1", "manager-1"],
    excludedRecipients: [],
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function thread(overrides = {}) {
  const now = new Date("2026-07-07T09:05:00.000Z");
  return {
    id: "report-1",
    reportId: "report-1",
    workerId: "worker-1",
    organizationId: "org-1",
    status: "open",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function reply(overrides = {}) {
  return {
    id: "reply-1",
    threadId: "report-1",
    reportId: "report-1",
    senderId: "manager-1",
    senderRole: "manager",
    body: "午後は商品登録から進めましょう",
    createdAt: new Date("2026-07-07T10:00:00.000Z"),
    ...overrides
  };
}

test("creates a consultation thread only for consultation reports", () => {
  const now = new Date("2026-07-07T09:05:00.000Z");
  const created = createConsultationThreadDocument({
    report: report()
  }, now);

  assert.equal(created.id, "report-1");
  assert.equal(created.reportId, "report-1");
  assert.equal(created.workerId, "worker-1");
  assert.equal(created.organizationId, "org-1");
  assert.equal(created.status, "open");
  assert.equal(created.createdAt, now);

  assert.equal(createConsultationThreadDocument({
    report: report({ reportStatus: "progress" })
  }), undefined);
});

test("worker and selected recipients can read and reply with in-app and email notifications", () => {
  const now = new Date("2026-07-07T10:00:00.000Z");
  const result = createReportReplyDocuments({
    replyId: "reply-1",
    thread: thread(),
    report: report(),
    actorId: "manager-1",
    actorRole: "manager",
    body: "午後は商品登録から進めましょう"
  }, now);

  assert.equal(result.reply.id, "reply-1");
  assert.equal(result.reply.senderId, "manager-1");
  assert.equal(result.reply.senderRole, "manager");
  assert.equal(result.reply.body, "午後は商品登録から進めましょう");
  assert.deepEqual(result.notificationLogs.map((log) => `${log.userId}:${log.channel}:${log.status}`), [
    "worker-1:in_app:sent",
    "worker-1:email:sent",
    "supporter-1:in_app:sent",
    "supporter-1:email:sent"
  ]);
  assert.equal(result.notificationLogs.every((log) => log.notificationType === "consultation_reply"), true);

  const detail = getConsultationThreadDetail({
    thread: thread(),
    report: report(),
    replies: [result.reply],
    actorId: "worker-1",
    actorRole: "worker"
  });
  assert.equal(detail.thread.id, "report-1");
  assert.equal(detail.replies.length, 1);
});

test("users outside selectedRecipients cannot read or reply", () => {
  assert.throws(() => createReportReplyDocuments({
    replyId: "reply-1",
    thread: thread(),
    report: report(),
    actorId: "manager-2",
    actorRole: "manager",
    body: "権限外返信"
  }), (error) => {
    assert.equal(error instanceof ConsultationThreadError, true);
    assert.equal(error.code, "CONSULTATION_ACCESS_DENIED");
    return true;
  });

  assert.throws(() => getConsultationThreadDetail({
    thread: thread(),
    report: report(),
    replies: [],
    actorId: "supporter-2",
    actorRole: "supporter"
  }), (error) => {
    assert.equal(error instanceof ConsultationThreadError, true);
    assert.equal(error.code, "CONSULTATION_ACCESS_DENIED");
    return true;
  });
});

test("worker or selected reply recipient can close consultation thread", () => {
  const now = new Date("2026-07-07T10:30:00.000Z");
  const closedByWorker = closeConsultationThreadDocument({
    thread: thread(),
    report: report(),
    actorId: "worker-1",
    actorRole: "worker"
  }, now);

  assert.equal(closedByWorker.status, "closed");
  assert.equal(closedByWorker.closedBy, "worker-1");
  assert.equal(closedByWorker.closedAt, now);

  const closedBySupporter = closeConsultationThreadDocument({
    thread: thread(),
    report: report(),
    actorId: "supporter-1",
    actorRole: "supporter"
  }, now);
  assert.equal(closedBySupporter.closedBy, "supporter-1");
});

test("worker can confirm report reply and create audit log", () => {
  const result = confirmReportReplyDocument({
    thread: thread(),
    report: report(),
    reply: reply(),
    actorId: "worker-1",
    actorRole: "worker"
  }, new Date("2026-07-07T10:10:00.000Z"));

  assert.equal(result.auditLog.action, "report_reply_confirmed");
  assert.equal(result.auditLog.targetId, "reply-1");
  assert.equal(result.auditLog.targetUserId, "worker-1");
});

test("manager consultation list includes only selected recipient threads", () => {
  const threads = listManagerConsultationThreads({
    managerId: "manager-1",
    threads: [
      thread(),
      thread({ id: "report-2", reportId: "report-2" })
    ],
    reports: [
      report(),
      report({
        id: "report-2",
        selectedRecipients: ["supporter-1"]
      })
    ]
  });

  assert.deepEqual(threads.map((item) => item.thread.id), ["report-1"]);
  assert.equal(threads[0].report.editedText, "相談したいこと：優先順位を相談したいです");
});
