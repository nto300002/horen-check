const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { test } = require("node:test");
const { getProfile } = require("../apps/shared/config");

function startService(command, args) {
  return spawn(command, args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });
}

async function waitForJson(url, attempts = 40) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError;
}

test("frontend, api, and db services respond for the selected profile", async () => {
  const profileName = process.argv[2] || "local";
  const profile = getProfile(profileName);
  const services = [
    startService("node", ["apps/db-emulator/src/server.js", profile.name]),
    startService("node", ["apps/api/src/server.js", profile.name]),
    startService("node", ["apps/frontend/server.js", profile.name])
  ];

  try {
    const db = await waitForJson(`${profile.dbUrl}/health`);
    const api = await waitForJson(`${profile.apiUrl}/health`);
    const frontend = await waitForJson(`${profile.frontendUrl}/health`);

    assert.equal(db.status, "ok");
    assert.equal(db.profile, profile.name);
    assert.equal(api.status, "ok");
    assert.equal(api.dbUrl, profile.dbUrl);
    assert.equal(frontend.status, "ok");
    assert.equal(frontend.apiUrl, profile.apiUrl);
  } finally {
    for (const service of services) {
      service.kill("SIGTERM");
    }
  }
});
