const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  ReportScheduleError,
  updateReportScheduleDocument
} = require("../lib/usecase/manageReportSchedule");

function baseSchedule(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1_AM_START",
    workerId: "worker-1",
    organizationId: "org-1",
    type: "AM_START",
    workStyle: "remote",
    time: "09:00",
    dayOfWeek: [1, 2, 3, 4, 5],
    enabled: true,
    createdBy: "manager-1",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("manager, supporter, or admin can configure a worker AM_START report schedule", () => {
  const now = new Date("2026-07-07T01:00:00.000Z");
  const result = updateReportScheduleDocument({
    id: "worker-1_AM_START",
    workerId: "worker-1",
    organizationId: "org-1",
    actorId: "manager-1",
    actorRole: "manager",
    existingSchedule: undefined,
    patch: {
      type: "AM_START",
      workStyle: "remote",
      time: "09:15",
      dayOfWeek: [1, 2, 3, 4, 5],
      enabled: true
    }
  }, now);

  assert.equal(result.id, "worker-1_AM_START");
  assert.equal(result.workerId, "worker-1");
  assert.equal(result.type, "AM_START");
  assert.equal(result.time, "09:15");
  assert.deepEqual(result.dayOfWeek, [1, 2, 3, 4, 5]);
  assert.equal(result.createdBy, "manager-1");
  assert.equal(result.updatedBy, "manager-1");
  assert.equal(result.createdAt, now);
  assert.equal(result.updatedAt, now);
});

test("updates an existing AM_START report schedule without changing ownership", () => {
  const now = new Date("2026-07-07T01:00:00.000Z");
  const result = updateReportScheduleDocument({
    id: "worker-1_AM_START",
    workerId: "worker-1",
    organizationId: "org-1",
    actorId: "supporter-1",
    actorRole: "supporter",
    existingSchedule: baseSchedule(),
    patch: {
      time: "09:30",
      dayOfWeek: [1, 3, 5],
      enabled: false
    }
  }, now);

  assert.equal(result.workerId, "worker-1");
  assert.equal(result.organizationId, "org-1");
  assert.equal(result.time, "09:30");
  assert.deepEqual(result.dayOfWeek, [1, 3, 5]);
  assert.equal(result.enabled, false);
  assert.equal(result.updatedBy, "supporter-1");
  assert.equal(result.createdAt.toISOString(), "2026-07-07T00:00:00.000Z");
});

test("rejects worker role and non-AM_START schedule changes in the first slice", () => {
  assert.throws(() => updateReportScheduleDocument({
    id: "worker-1_AM_START",
    workerId: "worker-1",
    organizationId: "org-1",
    actorId: "worker-1",
    actorRole: "worker",
    existingSchedule: undefined,
    patch: {
      type: "AM_START",
      time: "09:00",
      dayOfWeek: [1],
      workStyle: "remote"
    }
  }), (error) => {
    assert.equal(error instanceof ReportScheduleError, true);
    assert.equal(error.code, "REPORT_SCHEDULE_ACTOR_NOT_ALLOWED");
    return true;
  });

  assert.throws(() => updateReportScheduleDocument({
    id: "worker-1_AM_END",
    workerId: "worker-1",
    organizationId: "org-1",
    actorId: "admin-1",
    actorRole: "admin",
    existingSchedule: undefined,
    patch: {
      type: "AM_END",
      time: "12:00",
      dayOfWeek: [1],
      workStyle: "remote"
    }
  }), (error) => {
    assert.equal(error instanceof ReportScheduleError, true);
    assert.equal(error.code, "REPORT_TYPE_NOT_SUPPORTED");
    return true;
  });
});
