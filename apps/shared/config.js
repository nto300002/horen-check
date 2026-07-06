const profiles = {
  local: {
    name: "local",
    frontendPort: 5173,
    apiPort: 5001,
    dbPort: 18080,
    firebaseProjectId: "horen-check-local",
    apiBasePath: "/api"
  },
  production: {
    name: "production",
    frontendPort: 4173,
    apiPort: 5002,
    dbPort: 8081,
    firebaseProjectId: "horen-check-production",
    apiBasePath: "/api"
  }
};

function getProfile(profileName = "local") {
  const profile = profiles[profileName];
  if (!profile) {
    throw new Error(`Unknown profile: ${profileName}`);
  }

  return {
    ...profile,
    frontendUrl: `http://127.0.0.1:${profile.frontendPort}`,
    apiUrl: `http://127.0.0.1:${profile.apiPort}`,
    dbUrl: `http://127.0.0.1:${profile.dbPort}`
  };
}

module.exports = {
  getProfile,
  profiles
};
