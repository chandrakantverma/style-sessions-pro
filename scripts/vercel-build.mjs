/**
 * vercel-build.mjs
 *
 * TanStack Start (1.168.x) always outputs to dist/client + dist/server.
 * This script restructures the output into Vercel Build Output API v3 format.
 *
 * server.js is ESM. Vercel needs either:
 *   - A package.json with "type":"module" in the function dir, OR
 *   - A CJS wrapper that dynamic-imports the ESM bundle
 *
 * We use option A: ship a package.json alongside the ESM bundle.
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const dist = resolve(root, "dist");
const out = resolve(root, ".vercel/output");
const funcDir = join(out, "functions/__server.func");

// ── 1. Vite build ────────────────────────────────────────────────────────────
console.log("▶ Building with Vite…");
execSync("npm run build", { stdio: "inherit", env: { ...process.env } });

// ── 2. Clean + scaffold output dirs ──────────────────────────────────────────
console.log("▶ Preparing .vercel/output…");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "static"), { recursive: true });
mkdirSync(funcDir, { recursive: true });

// ── 3. Static assets ─────────────────────────────────────────────────────────
const clientDir = join(dist, "client");
if (!existsSync(clientDir)) { console.error("✗ dist/client missing"); process.exit(1); }
cpSync(clientDir, join(out, "static"), { recursive: true });
console.log("  ✓ dist/client → .vercel/output/static");

// ── 4. Server bundle ─────────────────────────────────────────────────────────
const serverDir = join(dist, "server");
if (!existsSync(serverDir)) { console.error("✗ dist/server missing"); process.exit(1); }
cpSync(serverDir, funcDir, { recursive: true });
console.log("  ✓ dist/server → .vercel/output/functions/__server.func");

// package.json with "type":"module" so Node treats .js files as ESM
writeFileSync(join(funcDir, "package.json"), JSON.stringify({ type: "module" }, null, 2));

// The entry point — adapts Vercel's (req, res) to TanStack Start's fetch handler
writeFileSync(join(funcDir, "index.js"), `
import { Readable } from "node:stream";
import startBundle from "./server.js";

const fetchHandler = startBundle?.default ?? startBundle;

async function toWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host  = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const url   = new URL(req.url ?? "/", \`\${proto}://\${host}\`);

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    Array.isArray(v) ? v.forEach(val => headers.append(k, val)) : headers.set(k, v);
  }

  const method  = (req.method ?? "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  return new Request(url.toString(), {
    method,
    headers,
    ...(hasBody ? { body: Readable.toWeb(req), duplex: "half" } : {}),
  });
}

async function sendResponse(webRes, res) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((v, k) => res.setHeader(k, v));
  if (webRes.body) {
    const reader = webRes.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        await new Promise((ok, fail) => res.write(value, e => e ? fail(e) : ok(undefined)));
      }
    } finally {
      reader.releaseLock();
    }
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const webReq = await toWebRequest(req);
    const webRes = await fetchHandler.fetch(webReq);
    await sendResponse(webRes, res);
  } catch (err) {
    console.error("[ssr crash]", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain");
      res.end("Internal Server Error");
    }
  }
}
`.trimStart());

// .vc-config.json
writeFileSync(join(funcDir, ".vc-config.json"), JSON.stringify({
  runtime: "nodejs20.x",
  handler: "index.js",
  launcherType: "Nodejs",
  shouldAddHelpers: true,
  supportsResponseStreaming: true,
}, null, 2));

console.log("  ✓ Wrote index.js + package.json + .vc-config.json");

// ── 5. Routing config ─────────────────────────────────────────────────────────
writeFileSync(join(out, "config.json"), JSON.stringify({
  version: 3,
  routes: [
    { src: "^/assets/(.*)$", headers: { "cache-control": "public, max-age=31536000, immutable" }, continue: true },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__server" },
  ],
}, null, 2));

console.log("  ✓ Wrote config.json");
console.log("\n✅ Vercel build output ready at .vercel/output/");
