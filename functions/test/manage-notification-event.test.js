const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  cancelNotificationEventDocument,
  generateDailyNotificationEventDocuments,
  listRecentNotificationLogs,
  NotificationEventError,
  registerFcmTokenDocument,
  sendDueNotificationReminders,
  snoozeNotificationEventDocument,
  unregisterFcmTokenDocument,
  updateNotificationSettingsDocument
} = require("../lib/usecase/manageNotificationEvent");

function schedule(overrides = {}) {
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

function event(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1_AM_START_2026-07-07",
    scheduleId: "worker-1_AM_START",
    userId: "worker-1",
    title: "AM開始報告の時間です",
    type: "AM_START",
    dueAt: new Date("2026-07-07T09:00:00.000Z"),
    status: "pending",
    notificationCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function settings(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    userId: "worker-1",
    pushEnabled: true,
    mailEnabled: true,
    soundEnabled: true,
    fallbackEmail: "worker@example.com",
    fcmToken: "token-1",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("generates deterministic daily notification events without duplicates", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const events = generateDailyNotificationEventDocuments({
    schedules: [
      schedule(),
      schedule({
        id: "worker-1_CUSTOM_1",
        type: "CUSTOM",
        title: "薬を飲む",
        time: "10:30"
      })
    ],
    existingEvents: [event()],
    targetDate: new Date("2026-07-07T00:00:00.000Z")
  }, now);

  assert.deepEqual(events.map((created) => created.id), ["worker-1_CUSTOM_1_2026-07-07"]);
  assert.equal(events[0].dueAt.toISOString(), "2026-07-07T10:30:00.000Z");
  assert.equal(events[0].status, "pending");
  assert.equal(events[0].notificationCount, 0);
});

test("skips disabled, deleted, and non-weekday schedules during daily generation", () => {
  const events = generateDailyNotificationEventDocuments({
    schedules: [
      schedule({ enabled: false }),
      schedule({ id: "deleted", deletedAt: new Date("2026-07-06T00:00:00.000Z") }),
      schedule({ id: "sunday-only", dayOfWeek: [0] })
    ],
    existingEvents: [],
    targetDate: new Date("2026-07-07T00:00:00.000Z")
  });

  assert.deepEqual(events, []);
});

test("sends due reminders every interval and marks event notified at repeat limit", async () => {
  const sentPushes = [];
  const result = await sendDueNotificationReminders({
    events: [
      event({
        notificationCount: 2,
        lastNotifiedAt: new Date("2026-07-07T09:05:00.000Z")
      })
    ],
    schedulesById: {
      "worker-1_AM_START": schedule()
    },
    settingsByUserId: {
      "worker-1": settings()
    },
    now: new Date("2026-07-07T09:10:00.000Z"),
    pushSender: async (message) => {
      sentPushes.push(message);
    },
    mailer: async () => {}
  });

  assert.equal(sentPushes.length, 1);
  assert.equal(result.events[0].notificationCount, 3);
  assert.equal(result.events[0].status, "notified");
  assert.equal(result.logs.some((log) => log.channel === "push" && log.status === "sent"), true);
});

test("does not resend before repeat interval elapses", async () => {
  const result = await sendDueNotificationReminders({
    events: [
      event({
        notificationCount: 1,
        lastNotifiedAt: new Date("2026-07-07T09:06:00.000Z")
      })
    ],
    schedulesById: {
      "worker-1_AM_START": schedule()
    },
    settingsByUserId: {
      "worker-1": settings()
    },
    now: new Date("2026-07-07T09:10:00.000Z"),
    pushSender: async () => {
      throw new Error("should not send");
    },
    mailer: async () => {
      throw new Error("should not send");
    }
  });

  assert.deepEqual(result.events, []);
  assert.deepEqual(result.logs, []);
});

test("falls back to mail when push sending fails", async () => {
  const sentEmails = [];
  const result = await sendDueNotificationReminders({
    events: [event()],
    schedulesById: {
      "worker-1_AM_START": schedule()
    },
    settingsByUserId: {
      "worker-1": settings()
    },
    now: new Date("2026-07-07T09:00:00.000Z"),
    pushSender: async () => {
      throw new Error("push failed");
    },
    mailer: async (message) => {
      sentEmails.push(message);
    }
  });

  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, "worker@example.com");
  assert.equal(result.logs.some((log) => log.channel === "push" && log.status === "failed"), true);
  assert.equal(result.logs.some((log) => log.channel === "email" && log.status === "sent"), true);
});

test("falls back to mail when push is disabled or token is missing", async () => {
  const sentEmails = [];
  await sendDueNotificationReminders({
    events: [event()],
    schedulesById: {
      "worker-1_AM_START": schedule()
    },
    settingsByUserId: {
      "worker-1": settings({ pushEnabled: false, fcmToken: undefined })
    },
    now: new Date("2026-07-07T09:00:00.000Z"),
    pushSender: async () => {
      throw new Error("should not push");
    },
    mailer: async (message) => {
      sentEmails.push(message);
    }
  });

  assert.equal(sentEmails.length, 1);
});

test("snoozes notification events using schedule snooze minutes", () => {
  const snoozed = snoozeNotificationEventDocument({
    existingEvent: event(),
    schedule: schedule({ snoozeMinutes: 10 }),
    now: new Date("2026-07-07T09:00:00.000Z")
  });

  assert.equal(snoozed.status, "snoozed");
  assert.equal(snoozed.snoozeUntil.toISOString(), "2026-07-07T09:10:00.000Z");
});

test("cancels only pending or snoozed notification events", () => {
  const cancelled = cancelNotificationEventDocument({
    existingEvent: event({ status: "snoozed" })
  }, new Date("2026-07-07T09:00:00.000Z"));

  assert.equal(cancelled.status, "cancelled");

  assert.throws(() => cancelNotificationEventDocument({
    existingEvent: event({ status: "notified" })
  }), (error) => {
    assert.equal(error instanceof NotificationEventError, true);
    assert.equal(error.code, "NOTIFICATION_EVENT_ALREADY_FINALIZED");
    return true;
  });
});

test("lists notification logs from the last 30 days only", () => {
  const logs = listRecentNotificationLogs({
    logs: [
      { id: "old", userId: "worker-1", createdAt: new Date("2026-06-06T23:59:59.000Z") },
      { id: "recent", userId: "worker-1", createdAt: new Date("2026-06-07T00:00:00.000Z") },
      { id: "other-user", userId: "worker-2", createdAt: new Date("2026-07-07T00:00:00.000Z") }
    ],
    userId: "worker-1",
    now: new Date("2026-07-07T00:00:00.000Z")
  });

  assert.deepEqual(logs.map((log) => log.id), ["recent"]);
});

test("registers, unregisters, and updates notification settings", () => {
  const now = new Date("2026-07-07T09:00:00.000Z");
  const registered = registerFcmTokenDocument({
    existingSettings: settings({ fcmToken: undefined }),
    fcmToken: "token-2"
  }, now);
  assert.equal(registered.fcmToken, "token-2");
  assert.equal(registered.pushEnabled, true);

  const unregistered = unregisterFcmTokenDocument({
    existingSettings: registered
  }, now);
  assert.equal(Object.hasOwn(unregistered, "fcmToken"), false);
  assert.equal(unregistered.pushEnabled, false);

  const updated = updateNotificationSettingsDocument({
    existingSettings: unregistered,
    patch: {
      mailEnabled: false,
      soundEnabled: false,
      fallbackEmail: "new@example.com"
    }
  }, now);
  assert.equal(updated.mailEnabled, false);
  assert.equal(updated.soundEnabled, false);
  assert.equal(updated.fallbackEmail, "new@example.com");
});
