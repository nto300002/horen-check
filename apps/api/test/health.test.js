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
