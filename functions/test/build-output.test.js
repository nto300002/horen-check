const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

test("functions build emits the HTTPS api entry point", () => {
  const outputPath = path.join(__dirname, "..", "lib", "index.js");
  const output = fs.readFileSync(outputPath, "utf8");

  assert.match(output, /exports\.api/);
  assert.match(output, /functions-api/);
});
