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

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        entry: "src/server.ts",
        // Use Vercel preset when deploying, local node server in dev.
        // NITRO_PRESET=vercel is set automatically by Vercel's build environment.
        // You can also set it manually: NITRO_PRESET=vercel npm run build
        preset: process.env["NITRO_PRESET"] ?? "node-server",
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
