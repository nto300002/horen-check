const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  generateDailyReportEventDocuments,
  sendDueReportReminders
} = require("../lib/usecase/manageReportEvent");

function schedule(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1_AM_START",
    workerId: "worker-1",
    organizationId: "org-1",
    type: "AM_START",
    workStyle: "remote",
    dayOfWeek: [1, 2, 3, 4, 5],
    time: "09:00",
    enabled: true,
    createdBy: "manager-1",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function event(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1_AM_START_2026-07-07T09:00:00.000Z",
    scheduleId: "worker-1_AM_START",
    workerId: "worker-1",
    organizationId: "org-1",
    type: "AM_START",
    dueAt: new Date("2026-07-07T09:00:00.000Z"),
    status: "pending",
    workStyle: "remote",
    employmentContext: "supported_facility",
    notificationCount: 0,
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

test("generates daily AM/PM report events at midnight without duplicates", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const reportSchedules = [
    schedule({ id: "worker-1_AM_START", type: "AM_START", time: "09:00" }),
    schedule({ id: "worker-1_AM_END", type: "AM_END", time: "12:00" }),
    schedule({ id: "worker-1_PM_START", type: "PM_START", time: "13:00" }),
    schedule({ id: "worker-1_PM_END", type: "PM_END", time: "17:00" })
  ];
  const events = generateDailyReportEventDocuments({
    schedules: reportSchedules,
    existingEvents: [event()],
    workerSettingsByWorkerId: {
      "worker-1": workerSettings()
    },
    targetDate: new Date("2026-07-07T00:00:00.000Z")
  }, now);

  assert.deepEqual(events.map((created) => created.id), [
    "worker-1_AM_END_2026-07-07T12:00:00.000Z",
    "worker-1_PM_START_2026-07-07T13:00:00.000Z",
    "worker-1_PM_END_2026-07-07T17:00:00.000Z"
  ]);
  assert.deepEqual(events.map((created) => created.type), ["AM_END", "PM_START", "PM_END"]);
  assert.equal(events[0].workerId, "worker-1");
  assert.equal(events[0].dueAt.toISOString(), "2026-07-07T12:00:00.000Z");
  assert.equal(events[0].employmentContext, "supported_facility");
  assert.equal(events[0].status, "pending");
});

test("skips disabled, non-weekday, and missing-settings schedules", () => {
  const events = generateDailyReportEventDocuments({
    schedules: [
      schedule({ enabled: false }),
      schedule({ id: "sunday-only", dayOfWeek: [0] }),
      schedule({ id: "missing-settings", workerId: "missing-worker" })
    ],
    existingEvents: [],
    workerSettingsByWorkerId: {
      "worker-1": workerSettings()
    },
    targetDate: new Date("2026-07-07T00:00:00.000Z")
  });

  assert.deepEqual(events, []);
});

test("sends due AM/PM push reminders with safe body, type title, and report click route", async () => {
  const sentPushes = [];
  const result = await sendDueReportReminders({
    events: [
      event(),
      event({
        id: "worker-1_AM_END_2026-07-07T12:00:00.000Z",
        scheduleId: "worker-1_AM_END",
        type: "AM_END",
        dueAt: new Date("2026-07-07T12:00:00.000Z")
      }),
      event({
        id: "worker-1_PM_START_2026-07-07T13:00:00.000Z",
        scheduleId: "worker-1_PM_START",
        type: "PM_START",
        dueAt: new Date("2026-07-07T13:00:00.000Z")
      }),
      event({
        id: "worker-1_PM_END_2026-07-07T17:00:00.000Z",
        scheduleId: "worker-1_PM_END",
        type: "PM_END",
        dueAt: new Date("2026-07-07T17:00:00.000Z")
      })
    ],
    settingsByUserId: {
      "worker-1": settings()
    },
    now: new Date("2026-07-07T17:00:00.000Z"),
    pushSender: async (message) => {
      sentPushes.push(message);
    }
  });

  assert.equal(sentPushes.length, 4);
  assert.equal(sentPushes[0].token, "token-1");
  assert.equal(sentPushes[0].clickUrl, "/worker/today/report/worker-1_AM_START_2026-07-07T09:00:00.000Z");
  assert.match(sentPushes[0].title, /AM開始報告/);
  assert.match(sentPushes[1].title, /AM終了報告/);
  assert.match(sentPushes[2].title, /PM開始報告/);
  assert.match(sentPushes[3].title, /PM終了報告/);
  assert.doesNotMatch(sentPushes[0].body, /Worker One|作業|報告本文/);
  assert.equal(result.events[0].status, "notified");
  assert.equal(result.events[0].notificationCount, 1);
  assert.equal(result.logs.some((log) => log.channel === "push" && log.status === "sent"), true);
});

test("does not resend notified events or future report events", async () => {
  const result = await sendDueReportReminders({
    events: [
      event({ status: "notified" }),
      event({
        id: "future",
        dueAt: new Date("2026-07-07T09:30:00.000Z")
      })
    ],
    settingsByUserId: {
      "worker-1": settings()
    },
    now: new Date("2026-07-07T09:00:00.000Z"),
    pushSender: async () => {
      throw new Error("should not send");
    }
  });

  assert.deepEqual(result.events, []);
  assert.deepEqual(result.logs, []);
});
