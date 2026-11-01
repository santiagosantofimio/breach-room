import { defineConfig } from "@playwright/test";

const SMOKE_SECRET = "playwright-smoke-only-not-a-real-secret";
const FRONTEND_PORT = 5173;
const API_PORT = 8080;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
  },
  webServer: [
    {
      command: "java -jar ../backend/target/breach-room.jar",
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: true,
      env: {
        FLAG_SECRET: SMOKE_SECRET,
        SESSION_SECRET: SMOKE_SECRET,
        ALLOWED_ORIGIN: `http://localhost:${FRONTEND_PORT}`,
      },
    },
    {
      command: `npx vite --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: true,
      env: { VITE_API_ORIGIN: `http://localhost:${API_PORT}` },
    },
  ],
});
