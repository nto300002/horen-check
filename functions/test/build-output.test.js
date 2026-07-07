const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

test("functions build emits the HTTPS api entry point", () => {
  const outputPath = path.join(__dirname, "..", "lib", "index.js");
  const output = fs.readFileSync(outputPath, "utf8");

  assert.match(output, /exports\.api/);
  assert.match(output, /functions-api/);
  assert.match(output, /createNotificationUserProfile/);
  assert.match(output, /createNotificationSchedule/);
  assert.match(output, /updateNotificationSchedule/);
  assert.match(output, /deleteNotificationSchedule/);
  assert.match(output, /generateDailyNotificationEvents/);
  assert.match(output, /sendDueNotificationReminders/);
  assert.match(output, /snoozeNotificationEvent/);
  assert.match(output, /cancelNotificationEvent/);
  assert.match(output, /listNotificationLogs/);
  assert.match(output, /registerFcmToken/);
  assert.match(output, /unregisterFcmToken/);
  assert.match(output, /updateNotificationSettings/);
  assert.match(output, /inviteUser/);
  assert.match(output, /acceptInvitation/);
  assert.match(output, /updateUserRole/);
  assert.match(output, /assignUser/);
  assert.match(output, /deactivateAssignment/);
  assert.match(output, /deactivateUser/);
});
