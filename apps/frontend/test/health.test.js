const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createFrontendServer } = require("../server");

test("frontend serves index and health endpoint", async () => {
  const server = createFrontendServer("local");
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  try {
    const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
    const health = await healthResponse.json();
    assert.equal(healthResponse.status, 200);
    assert.equal(health.service, "frontend");
    assert.equal(health.profile, "local");

    const indexResponse = await fetch(`http://127.0.0.1:${port}/`);
    const html = await indexResponse.text();
    assert.equal(indexResponse.status, 200);
    assert.match(html, /ホウレンチェック/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
