const http = require("node:http");
const { getProfile } = require("../../shared/config");

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function createDbServer(profileName = "local") {
  const profile = getProfile(profileName);
  const store = {
    users: [],
    notificationSchedules: [],
    notificationEvents: [],
    reports: [],
    auditLogs: []
  };

  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, {
        service: "db",
        status: "ok",
        profile: profile.name,
        projectId: profile.firebaseProjectId,
        collections: Object.keys(store)
      });
    }

    if (req.method === "GET" && url.pathname === "/__admin/collections") {
      return json(res, 200, store);
    }

    return json(res, 404, {
      error: "not_found",
      message: "DB emulator route not found"
    });
  });
}

function start(profileName = process.argv[2] || "local") {
  const profile = getProfile(profileName);
  const server = createDbServer(profileName);
  server.listen(profile.dbPort, "127.0.0.1", () => {
    console.log(`[db:${profile.name}] http://127.0.0.1:${profile.dbPort}`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = {
  createDbServer,
  start
};
