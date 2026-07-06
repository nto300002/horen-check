const { spawn } = require("node:child_process");
const { getProfile } = require("../apps/shared/config");

const profileName = process.argv[2] || "local";
const profile = getProfile(profileName);

const services = [
  ["db", "node", ["apps/db-emulator/src/server.js", profile.name]],
  ["api", "node", ["apps/api/src/server.js", profile.name]],
  ["frontend", "node", ["apps/frontend/server.js", profile.name]]
];

const children = services.map(([name, command, args]) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
});

console.log(`Horen Check ${profile.name} stack`);
console.log(`frontend: ${profile.frontendUrl}`);
console.log(`api:      ${profile.apiUrl}`);
console.log(`db:       ${profile.dbUrl}`);

function shutdown() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});
