const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createNotificationUserProfileDocuments
} = require("../lib/usecase/createNotificationUserProfile");

test("creates notification mode user profile documents", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const result = createNotificationUserProfileDocuments({
    uid: "worker-1",
    name: "Worker One",
    email: "WORKER@example.com"
  }, now);

  assert.deepEqual(result.user, {
    id: "worker-1",
    name: "Worker One",
    email: "worker@example.com",
    role: "worker",
    accountMode: "notification_mode",
    organizationId: "personal",
    active: true,
    createdAt: now,
    updatedAt: now
  });

  assert.equal(result.notificationSettings.userId, "worker-1");
  assert.equal(result.notificationSettings.pushEnabled, false);
  assert.equal(result.notificationSettings.mailEnabled, true);
  assert.equal(result.notificationSettings.soundEnabled, true);
  assert.equal(result.notificationSettings.fallbackEmail, "worker@example.com");
});

test("creates the initial four AM/PM notification schedules", () => {
  const result = createNotificationUserProfileDocuments({
    uid: "worker-1",
    name: "Worker One",
    email: "worker@example.com"
  });

  assert.deepEqual(
    result.notificationSchedules.map((schedule) => schedule.type),
    ["AM_START", "AM_END", "PM_START", "PM_END"]
  );
  assert.deepEqual(
    result.notificationSchedules.map((schedule) => schedule.title),
    [
      "AM開始報告の時間です",
      "AM終了報告の時間です",
      "PM開始報告の時間です",
      "PM終了報告の時間です"
    ]
  );

  for (const schedule of result.notificationSchedules) {
    assert.equal(schedule.userId, "worker-1");
    assert.equal(schedule.enabled, true);
    assert.deepEqual(schedule.dayOfWeek, [1, 2, 3, 4, 5]);
    assert.equal(schedule.snoozeMinutes, 5);
    assert.equal(schedule.repeatIntervalMinutes, 5);
    assert.equal(schedule.repeatLimitCount, 3);
    assert.equal(schedule.mailFallbackEnabled, true);
  }
});

test("does not require an FCM token to create the profile documents", () => {
  const result = createNotificationUserProfileDocuments({
    uid: "worker-1",
    name: "Worker One",
    email: "worker@example.com"
  });

  assert.equal(result.user.id, "worker-1");
  assert.equal(Object.hasOwn(result.notificationSettings, "fcmToken"), false);
});

test("requires uid, name, and email", () => {
  assert.throws(() => createNotificationUserProfileDocuments({
    uid: "",
    name: "Worker One",
    email: "worker@example.com"
  }), /uid is required/);
  assert.throws(() => createNotificationUserProfileDocuments({
    uid: "worker-1",
    name: "",
    email: "worker@example.com"
  }), /name is required/);
  assert.throws(() => createNotificationUserProfileDocuments({
    uid: "worker-1",
    name: "Worker One",
    email: ""
  }), /email is required/);
});
