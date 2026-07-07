const assert = require("node:assert/strict");

const projectId = process.env.GCLOUD_PROJECT || "horen-check-rules-test";
const region = process.env.FUNCTIONS_REGION || "us-central1";
const url = `http://127.0.0.1:5001/${projectId}/${region}/api/health`;

async function main() {
  const response = await fetch(url);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.service, "functions-api");
  assert.equal(body.status, "ok");
  console.log(`Functions emulator health check passed: ${url}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
