export const checkEnvVars = (log: boolean): void => {
  const requiredVars = [
    "CONNECTION_STRING",
    "APP_BASE_URL",
    "SERVER_PORT",
    "APP_PORT",
    "ID_CHARACTERS",
    "SEED",
    "ROOM_ID_LENGTH",
    "DB_NAME",
  ];

  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
    if (log) console.log(`Environment variable found: ${variable}`);
  }
};
