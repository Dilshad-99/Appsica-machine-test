import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

const getBackendTarget = (): string => {
  if (process.env.VITE_BACKEND_URL) return process.env.VITE_BACKEND_URL;
  if (process.env.BACKEND_PORT)
    return `http://localhost:${process.env.BACKEND_PORT}`;

  try {
    const serverEnvPath = path.resolve(process.cwd(), "../server/.env");
    if (fs.existsSync(serverEnvPath)) {
      const envContent = fs.readFileSync(serverEnvPath, "utf-8");
      const match = envContent.match(/^PORT\s*=\s*(\d+)/m);
      if (match && match[1]) {
        return `http://localhost:${match[1]}`;
      }
    }
  } catch {
    // fallback
  }

  return "http://localhost:5010";
};

const backendTarget = getBackendTarget();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/socket.io": {
        target: backendTarget,
        ws: true,
      },
    },
  },
});
