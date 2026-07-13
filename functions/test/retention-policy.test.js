const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  selectRetentionCandidates
} = require("../lib/usecase/retentionPolicy");

test("selects documents past MVP retention periods for deletion or anonymization", () => {
  const now = new Date("2026-07-09T00:00:00.000Z");
  const candidates = selectRetentionCandidates({
    now,
    notificationEvents: [
      { id: "new-notification", createdAt: new Date("2026-06-20T00:00:00.000Z") },
      { id: "old-notification", createdAt: new Date("2026-05-01T00:00:00.000Z") }
    ],
    notificationLogs: [
      { id: "old-log", createdAt: new Date("2026-05-01T00:00:00.000Z") }
    ],
    reports: [
      { id: "new-report", submittedAt: new Date("2026-01-10T00:00:00.000Z") },
      { id: "old-report", submittedAt: new Date("2025-12-01T00:00:00.000Z") }
    ],
    reportDeliveries: [
      { id: "old-delivery", createdAt: new Date("2025-12-01T00:00:00.000Z") }
    ],
    auditLogs: [
      { id: "kept-audit", createdAt: new Date("2025-06-01T00:00:00.000Z") }
    ],
    inactiveUsers: [
      { id: "recent-user", updatedAt: new Date("2026-01-10T00:00:00.000Z") },
      { id: "old-user", updatedAt: new Date("2025-12-01T00:00:00.000Z") }
    ]
  });

  assert.deepEqual(candidates.delete.notificationEventIds, ["old-notification"]);
  assert.deepEqual(candidates.delete.notificationLogIds, ["old-log"]);
  assert.deepEqual(candidates.anonymize.reportIds, ["old-report"]);
  assert.deepEqual(candidates.anonymize.reportDeliveryIds, ["old-delivery"]);
  assert.deepEqual(candidates.anonymize.inactiveUserIds, ["old-user"]);
  assert.deepEqual(candidates.keep.auditLogIds, ["kept-audit"]);
});
