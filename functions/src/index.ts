import { onRequest } from "firebase-functions/v2/https";

export const api = onRequest((request, response) => {
  if (request.path === "/health") {
    response.json({
      service: "functions-api",
      status: "ok"
    });
    return;
  }

  response.status(404).json({
    error: "not_found"
  });
});
