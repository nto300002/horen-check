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

test("manager, supporter, or admin can configure AM/PM report schedules", () => {
  const now = new Date("2026-07-07T01:00:00.000Z");
  const results = ["AM_START", "AM_END", "PM_START", "PM_END"].map((type, index) =>
    updateReportScheduleDocument({
      id: `worker-1_${type}`,
      workerId: "worker-1",
      organizationId: "org-1",
      actorId: "manager-1",
      actorRole: "manager",
      existingSchedule: undefined,
      patch: {
        type,
        workStyle: "remote",
        time: `09:1${index}`,
        dayOfWeek: [1, 2, 3, 4, 5],
        enabled: true
      }
    }, now)
  );

  assert.deepEqual(results.map((result) => result.type), ["AM_START", "AM_END", "PM_START", "PM_END"]);
  assert.equal(results[0].id, "worker-1_AM_START");
  assert.equal(results[0].workerId, "worker-1");
  assert.equal(results[0].createdBy, "manager-1");
  assert.equal(results[0].updatedBy, "manager-1");
  assert.equal(results[0].createdAt, now);
  assert.equal(results[0].updatedAt, now);
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

test("rejects worker role for report schedule changes", () => {
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
});
