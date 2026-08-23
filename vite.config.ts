import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// NOTE: Do NOT add TanStackRouterVite() here.
// tanstackStart() already includes the TanStack Router code-splitter and
// route-tree generator internally. Adding TanStackRouterVite() on top
// registers the code-splitter twice and causes:
//   [plugin:tanstack-router:code-splitter:compile-reference-file]
//   Duplicate declaration "hot"

// Detect Vercel build environment — VERCEL=1 is set automatically by Vercel.
// Falls back to an explicit NITRO_PRESET override, then node-server for local dev.
const nitroPreset =
  process.env["NITRO_PRESET"] ??
  (process.env["VERCEL"] === "1" ? "vercel" : "node-server");

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        entry: "src/server.ts",
        preset: nitroPreset,
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 8080,
    host: true,
    strictPort: true,
  },
  build: {
    sourcemap: true,
  },
});
