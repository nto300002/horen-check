const http = require("node:http");
const { getProfile } = require("../../shared/config");

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  res.end(body);
}

function createApiServer(profileName = "local") {
  const profile = getProfile(profileName);

  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type"
      });
      return res.end();
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, {
        service: "api",
        status: "ok",
        profile: profile.name,
        dbUrl: profile.dbUrl
      });
    }

    if (req.method === "GET" && url.pathname === "/api/environment") {
      return json(res, 200, {
        app: "horen-check",
        profile: profile.name,
        frontendUrl: profile.frontendUrl,
        apiUrl: profile.apiUrl,
        dbUrl: profile.dbUrl,
        firebaseProjectId: profile.firebaseProjectId
      });
    }

    return json(res, 404, {
      error: "not_found",
      message: "API route not found"
    });
  });
}

function start(profileName = process.argv[2] || "local") {
  const profile = getProfile(profileName);
  const server = createApiServer(profileName);
  server.listen(profile.apiPort, "127.0.0.1", () => {
    console.log(`[api:${profile.name}] http://127.0.0.1:${profile.apiPort}`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = {
  createApiServer,
  start
};
