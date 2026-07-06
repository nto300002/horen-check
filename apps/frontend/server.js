const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { getProfile } = require("../shared/config");

const publicDir = path.join(__dirname, "web");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function createFrontendServer(profileName = "local") {
  const profile = getProfile(profileName);

  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      });
      return res.end(JSON.stringify({
        service: "frontend",
        status: "ok",
        profile: profile.name,
        apiUrl: profile.apiUrl
      }, null, 2));
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.normalize(path.join(publicDir, requestedPath));

    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        fs.readFile(path.join(publicDir, "index.html"), (fallbackError, fallbackData) => {
          if (fallbackError) {
            res.writeHead(404);
            return res.end("Not found");
          }
          res.writeHead(200, { "content-type": contentTypes[".html"] });
          return res.end(fallbackData);
        });
        return;
      }

      const ext = path.extname(filePath);
      res.writeHead(200, {
        "content-type": contentTypes[ext] || "application/octet-stream",
        "cache-control": profile.name === "production" ? "public, max-age=300" : "no-store"
      });
      res.end(data);
    });
  });
}

function start(profileName = process.argv[2] || "local") {
  const profile = getProfile(profileName);
  const server = createFrontendServer(profileName);
  server.listen(profile.frontendPort, "127.0.0.1", () => {
    console.log(`[frontend:${profile.name}] http://127.0.0.1:${profile.frontendPort}`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = {
  createFrontendServer,
  start
};
