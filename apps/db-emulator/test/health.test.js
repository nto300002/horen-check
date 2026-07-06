const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createDbServer } = require("../src/server");

test("db emulator health exposes project and base collections", async () => {
  const server = createDbServer("production");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service, "db");
    assert.equal(body.status, "ok");
    assert.equal(body.profile, "production");
    assert.equal(body.projectId, "horen-check-production");
    assert.ok(body.collections.includes("users"));
    assert.ok(body.collections.includes("reports"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
