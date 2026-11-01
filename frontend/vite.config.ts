import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const API_ORIGIN_PLACEHOLDER = "__API_ORIGIN__";

function apiOriginInSecurityHeaders(apiOrigin: string): Plugin {
  return {
    name: "api-origin-in-security-headers",
    apply: "build",
    async closeBundle() {
      if (!apiOrigin) {
        throw new Error("VITE_API_ORIGIN is required to build the content security policy");
      }
      const headersPath = resolve("dist/_headers");
      const template = await readFile(headersPath, "utf8");
      await writeFile(headersPath, template.replaceAll(API_ORIGIN_PLACEHOLDER, apiOrigin));
    },
  };
}

export default defineConfig(({ mode }) => {
  const { VITE_API_ORIGIN = "" } = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), apiOriginInSecurityHeaders(VITE_API_ORIGIN)],
    build: { assetsInlineLimit: 0 },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
  };
});
