const assert = require("node:assert/strict");
const { test } = require("node:test");
const { collectionNames } = require("../lib/domain/firestoreModels");
const { collectionPath } = require("../lib/repository/collectionPaths");

test("exports all Firestore collections from the detailed design", () => {
  assert.deepEqual(collectionNames, [
    "users",
    "organizations",
    "assignments",
    "notificationSettings",
    "notificationSchedules",
    "notificationEvents",
    "workerSettings",
    "reportSchedules",
    "reportEvents",
    "reports",
    "reportDeliveries",
    "notificationLogs",
    "consultationThreads",
    "reportReplies",
    "auditLogs",
    "modeSwitchRequests",
    "idempotencyKeys"
  ]);
});

test("collectionPath returns stable root collection names", () => {
  assert.equal(collectionPath("users"), "users");
  assert.equal(collectionPath("reportEvents"), "reportEvents");
  assert.equal(collectionPath("idempotencyKeys"), "idempotencyKeys");
});
