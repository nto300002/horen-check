const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApiServer } = require("../src/server");

test("api health includes the selected profile and DB URL", async () => {
  const server = createApiServer("local");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service, "api");
    assert.equal(body.status, "ok");
    assert.equal(body.profile, "local");
    assert.equal(body.dbUrl, "http://127.0.0.1:18080");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("api creates a local notification mode registration", async () => {
  const server = createApiServer("local");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/notification-users`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Worker One",
        email: "worker@example.com",
        password: "Password!1"
      })
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.status, "ok");
    assert.equal(body.user.name, "Worker One");
    assert.equal(body.user.email, "worker@example.com");
    assert.equal(body.user.accountMode, "notification_mode");
    assert.deepEqual(
      body.notificationSchedules.map((schedule) => schedule.type),
      ["AM_START", "AM_END", "PM_START", "PM_END"]
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
