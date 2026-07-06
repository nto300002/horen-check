async function readJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function boot() {
  const frontend = document.querySelector("#frontend-status");
  const api = document.querySelector("#api-status");
  const db = document.querySelector("#db-status");

  try {
    const frontendHealth = await readJson("/health");
    frontend.textContent = `${frontendHealth.status} (${frontendHealth.profile})`;

    const apiHealth = await readJson(frontendHealth.apiUrl + "/health");
    api.textContent = `${apiHealth.status} (${apiHealth.profile})`;

    const dbHealth = await readJson(apiHealth.dbUrl + "/health");
    db.textContent = `${dbHealth.status} (${dbHealth.profile})`;
  } catch (error) {
    const message = "確認できません";
    frontend.textContent = frontend.textContent === "確認中" ? message : frontend.textContent;
    api.textContent = api.textContent === "確認中" ? message : api.textContent;
    db.textContent = db.textContent === "確認中" ? message : db.textContent;
    console.error(error);
  }
}

boot();
