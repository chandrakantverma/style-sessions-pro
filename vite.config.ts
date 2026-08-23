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
//
// The Vercel preset is set via NITRO_PRESET=vercel in the Vercel build env
// or via the vercel.json build.env config. This file does not need to set it.

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        entry: "src/server.ts",
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
