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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body === "" ? {} : JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function initialNotificationSchedules(userId, now) {
  return [
    ["AM_START", "09:00", "AM開始報告の時間です"],
    ["AM_END", "12:00", "AM終了報告の時間です"],
    ["PM_START", "13:00", "PM開始報告の時間です"],
    ["PM_END", "17:00", "PM終了報告の時間です"]
  ].map(([type, time, title]) => ({
    id: `${userId}_${type}`,
    userId,
    title,
    type,
    time,
    dayOfWeek: [1, 2, 3, 4, 5],
    enabled: true,
    snoozeMinutes: 5,
    repeatIntervalMinutes: 5,
    repeatLimitCount: 3,
    mailFallbackEnabled: true,
    createdAt: now,
    updatedAt: now
  }));
}

function createApiServer(profileName = "local") {
  const profile = getProfile(profileName);

  return http.createServer(async (req, res) => {
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

    if (req.method === "POST" && url.pathname === "/api/notification-users") {
      try {
        const body = await readJsonBody(req);
        const name = String(body.name ?? "").trim();
        const email = String(body.email ?? "").trim();
        const password = String(body.password ?? "");
        if (name === "" || email === "" || password === "") {
          return json(res, 400, {
            error: "invalid_argument",
            message: "name, email, and password are required"
          });
        }

        const now = new Date().toISOString();
        const userId = `local-${Date.now()}`;
        return json(res, 201, {
          status: "ok",
          user: {
            id: userId,
            name,
            email,
            role: "worker",
            accountMode: "notification_mode",
            organizationId: "local",
            active: true,
            createdAt: now,
            updatedAt: now
          },
          notificationSettings: {
            userId,
            pushEnabled: true,
            mailEnabled: true,
            soundEnabled: true,
            fallbackEmail: email,
            createdAt: now,
            updatedAt: now
          },
          notificationSchedules: initialNotificationSchedules(userId, now)
        });
      } catch (error) {
        return json(res, 400, {
          error: "invalid_json",
          message: "request body must be valid JSON"
        });
      }
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
