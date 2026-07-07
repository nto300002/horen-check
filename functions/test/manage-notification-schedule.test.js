const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createNotificationScheduleDocument,
  deleteNotificationScheduleDocument,
  NotificationScheduleError,
  updateNotificationScheduleDocument
} = require("../lib/usecase/manageNotificationSchedule");

function baseSchedule(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1_AM_START",
    userId: "worker-1",
    title: "AM開始報告の時間です",
    type: "AM_START",
    time: "09:00",
    dayOfWeek: [1, 2, 3, 4, 5],
    enabled: true,
    snoozeMinutes: 5,
    repeatIntervalMinutes: 5,
    repeatLimitCount: 3,
    mailFallbackEnabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("creates a custom notification schedule", () => {
  const now = new Date("2026-07-07T01:00:00.000Z");
  const schedule = createNotificationScheduleDocument({
    id: "custom-1",
    userId: "worker-1",
    title: "薬を飲む",
    time: "10:30",
    dayOfWeek: [1, 3, 5],
    existingCustomSchedules: []
  }, now);

  assert.equal(schedule.id, "custom-1");
  assert.equal(schedule.userId, "worker-1");
  assert.equal(schedule.type, "CUSTOM");
  assert.equal(schedule.title, "薬を飲む");
  assert.equal(schedule.time, "10:30");
  assert.deepEqual(schedule.dayOfWeek, [1, 3, 5]);
  assert.equal(schedule.enabled, true);
  assert.equal(schedule.snoozeMinutes, 5);
  assert.equal(schedule.repeatIntervalMinutes, 5);
  assert.equal(schedule.repeatLimitCount, 3);
  assert.equal(schedule.mailFallbackEnabled, true);
  assert.equal(schedule.createdAt, now);
  assert.equal(schedule.updatedAt, now);
});

test("rejects the eleventh active custom notification schedule", () => {
  const existingCustomSchedules = Array.from({ length: 10 }, (_, index) =>
    baseSchedule({
      id: `custom-${index + 1}`,
      type: "CUSTOM",
      title: `custom ${index + 1}`
    })
  );

  assert.throws(() => createNotificationScheduleDocument({
    id: "custom-11",
    userId: "worker-1",
    title: "11件目",
    time: "18:00",
    dayOfWeek: [1],
    existingCustomSchedules
  }), (error) => {
    assert.equal(error instanceof NotificationScheduleError, true);
    assert.equal(error.code, "CUSTOM_NOTIFICATION_LIMIT_REACHED");
    return true;
  });
});

test("allows updating only time, dayOfWeek, and enabled for initial schedules", () => {
  const now = new Date("2026-07-07T01:00:00.000Z");
  const updated = updateNotificationScheduleDocument({
    existingSchedule: baseSchedule(),
    patch: {
      time: "09:30",
      dayOfWeek: [1, 2, 4],
      enabled: false
    }
  }, now);

  assert.equal(updated.type, "AM_START");
  assert.equal(updated.title, "AM開始報告の時間です");
  assert.equal(updated.time, "09:30");
  assert.deepEqual(updated.dayOfWeek, [1, 2, 4]);
  assert.equal(updated.enabled, false);
  assert.equal(updated.updatedAt, now);
});

test("rejects type or title changes for initial schedules", () => {
  assert.throws(() => updateNotificationScheduleDocument({
    existingSchedule: baseSchedule(),
    patch: {
      title: "別タイトル"
    }
  }), (error) => {
    assert.equal(error instanceof NotificationScheduleError, true);
    assert.equal(error.code, "INITIAL_NOTIFICATION_IMMUTABLE_FIELD");
    return true;
  });

  assert.throws(() => updateNotificationScheduleDocument({
    existingSchedule: baseSchedule(),
    patch: {
      type: "CUSTOM"
    }
  }), (error) => {
    assert.equal(error instanceof NotificationScheduleError, true);
    assert.equal(error.code, "INITIAL_NOTIFICATION_IMMUTABLE_FIELD");
    return true;
  });
});

test("rejects fields other than time, dayOfWeek, and enabled for initial schedules", () => {
  assert.throws(() => updateNotificationScheduleDocument({
    existingSchedule: baseSchedule(),
    patch: {
      snoozeMinutes: 15
    }
  }), (error) => {
    assert.equal(error instanceof NotificationScheduleError, true);
    assert.equal(error.code, "INITIAL_NOTIFICATION_IMMUTABLE_FIELD");
    return true;
  });
});

test("allows updating custom notification schedule fields", () => {
  const updated = updateNotificationScheduleDocument({
    existingSchedule: baseSchedule({
      id: "custom-1",
      type: "CUSTOM",
      title: "薬を飲む",
      snoozeMinutes: 10
    }),
    patch: {
      title: "水分補給",
      time: "11:00",
      dayOfWeek: [2, 4],
      enabled: false,
      snoozeMinutes: 15
    }
  });

  assert.equal(updated.type, "CUSTOM");
  assert.equal(updated.title, "水分補給");
  assert.equal(updated.time, "11:00");
  assert.deepEqual(updated.dayOfWeek, [2, 4]);
  assert.equal(updated.enabled, false);
  assert.equal(updated.snoozeMinutes, 15);
});

test("rejects deleting initial schedules", () => {
  assert.throws(() => deleteNotificationScheduleDocument({
    existingSchedule: baseSchedule()
  }), (error) => {
    assert.equal(error instanceof NotificationScheduleError, true);
    assert.equal(error.code, "INITIAL_NOTIFICATION_DELETE_NOT_ALLOWED");
    return true;
  });
});

test("logically deletes custom schedules", () => {
  const now = new Date("2026-07-07T01:00:00.000Z");
  const deleted = deleteNotificationScheduleDocument({
    existingSchedule: baseSchedule({
      id: "custom-1",
      type: "CUSTOM",
      title: "薬を飲む"
    })
  }, now);

  assert.equal(deleted.deletedAt, now);
  assert.equal(deleted.enabled, false);
  assert.equal(deleted.updatedAt, now);
});
