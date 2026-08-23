/**
 * vercel-build.mjs
 *
 * TanStack Start (1.168.x) always outputs to dist/client + dist/server regardless
 * of NITRO_PRESET. This script runs after `vite build` and restructures the output
 * into Vercel's Build Output API v3 format:
 *
 *   .vercel/output/
 *     config.json               — routing config
 *     static/                   — served directly by Vercel's CDN
 *     functions/
 *       __server.func/
 *         index.js              — SSR handler (wrapped)
 *         .vc-config.json       — function config
 *
 * Reference: https://vercel.com/docs/build-output-api/v3
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const dist = resolve(root, "dist");
const out = resolve(root, ".vercel/output");

// ── 1. Run the normal Vite build ─────────────────────────────────────────────
console.log("▶ Building with Vite…");
execSync("npm run build", { stdio: "inherit", env: { ...process.env } });

// ── 2. Clean previous Vercel output ──────────────────────────────────────────
console.log("▶ Preparing .vercel/output…");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "static"), { recursive: true });
mkdirSync(join(out, "functions/__server.func"), { recursive: true });

// ── 3. Copy static assets (client build) → .vercel/output/static ─────────────
const clientDir = join(dist, "client");
if (!existsSync(clientDir)) {
  console.error("✗ dist/client not found — did the build succeed?");
  process.exit(1);
}
cpSync(clientDir, join(out, "static"), { recursive: true });
console.log("  ✓ Copied dist/client → .vercel/output/static");

// ── 4. Copy server bundle → .vercel/output/functions/__server.func ───────────
const serverDir = join(dist, "server");
if (!existsSync(serverDir)) {
  console.error("✗ dist/server not found — did the build succeed?");
  process.exit(1);
}
cpSync(serverDir, join(out, "functions/__server.func"), { recursive: true });

// Write the Vercel function entry wrapper
writeFileSync(
  join(out, "functions/__server.func/index.js"),
  `// Vercel serverless function entry point
import handler from "./server.js";
export default handler;
export const config = { runtime: "nodejs20.x" };
`
);

// Write .vc-config.json for the function
writeFileSync(
  join(out, "functions/__server.func/.vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.js",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
      supportsResponseStreaming: true,
    },
    null,
    2,
  ),
);
console.log("  ✓ Copied dist/server → .vercel/output/functions/__server.func");

// ── 5. Write Vercel routing config ───────────────────────────────────────────
writeFileSync(
  join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Serve static assets directly from CDN
        {
          src: "^/assets/(.*)$",
          headers: { "cache-control": "public, max-age=31536000, immutable" },
          continue: true,
        },
        // Static files (favicon, robots.txt, etc.)
        {
          handle: "filesystem",
        },
        // Everything else → SSR function
        {
          src: "/(.*)",
          dest: "/__server",
        },
      ],
    },
    null,
    2,
  ),
);
console.log("  ✓ Wrote .vercel/output/config.json");

console.log("\n✅ Vercel build output ready at .vercel/output/");
