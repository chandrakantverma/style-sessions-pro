/**
 * vercel-build.mjs
 *
 * Builds with Vite, then uses esbuild to fully bundle dist/server/server.js
 * and ALL its node_module dependencies into one self-contained CJS file.
 * Wraps it with a (req,res)→fetch adapter for Vercel's Node.js runtime.
 * Outputs to .vercel/output/ (Vercel Build Output API v3).
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const root    = process.cwd();
const dist    = resolve(root, "dist");
const out     = resolve(root, ".vercel/output");
const funcDir = join(out, "functions/__server.func");
const esbuild = join(root, "node_modules/.bin/esbuild");

// ── 1. Vite build ─────────────────────────────────────────────────────────────
console.log("▶  Running Vite build…");
execSync("npm run build", { stdio: "inherit", env: { ...process.env } });

// ── 2. Scaffold output dirs ───────────────────────────────────────────────────
console.log("▶  Scaffolding .vercel/output…");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "static"), { recursive: true });
mkdirSync(funcDir, { recursive: true });

// ── 3. Static assets ──────────────────────────────────────────────────────────
const clientDir = join(dist, "client");
if (!existsSync(clientDir)) { console.error("✗ dist/client missing"); process.exit(1); }
cpSync(clientDir, join(out, "static"), { recursive: true });
console.log("  ✓ dist/client → .vercel/output/static");

// ── 4. Write ESM adapter entry ────────────────────────────────────────────────
// Pure ESM — esbuild will bundle this + server.js + all node_modules into CJS.
const serverEntry = join(dist, "server", "server.js");
if (!existsSync(serverEntry)) { console.error("✗ dist/server/server.js missing"); process.exit(1); }

const adapterSrc = join(dist, "server", "_adapter.mjs");
writeFileSync(adapterSrc, `
import { Readable } from "node:stream";
import startBundle from "./server.js";

const fetchHandler = startBundle?.default ?? startBundle;

async function toWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host  = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url   = new URL(req.url || "/", proto + "://" + host);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach(val => headers.append(k, val));
    else headers.set(k, v);
  }
  const method  = (req.method || "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(url.toString(), {
    method, headers,
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
    } finally { reader.releaseLock(); }
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const webRes = await fetchHandler.fetch(await toWebRequest(req));
    await sendResponse(webRes, res);
  } catch (err) {
    const msg = err instanceof Error ? (err.stack || err.message) : String(err);
    console.error("[ssr error]", msg);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain");
      res.end(msg);
    }
  }
}
`.trimStart());

// ── 5. Bundle adapter + server.js + all deps into single CJS file ─────────────
// --bundle        : inline all imports including node_modules
// --format=cjs    : output CommonJS (handles CJS deps like react-dom correctly)
// --platform=node : use Node.js builtins, mark node:* as external
// --external:node:* : keep node built-ins as require('stream') etc
// The adapter is in dist/server/ next to server.js so relative imports resolve
const indexCjs = join(funcDir, "index.cjs");
console.log("  Bundling server + all deps with esbuild…");
execSync(
  `"${esbuild}" "${adapterSrc}" \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile="${indexCjs}" \
    --external:node:* \
    --log-level=warning`,
  { stdio: "inherit" }
);
console.log("  ✓ Bundled → __server.func/index.cjs (CJS, fully self-contained)");

// .vc-config.json
writeFileSync(join(funcDir, ".vc-config.json"), JSON.stringify({
  runtime: "nodejs20.x",
  handler: "index.cjs",
  launcherType: "Nodejs",
  shouldAddHelpers: true,
  supportsResponseStreaming: true,
}, null, 2));
console.log("  ✓ Wrote .vc-config.json");

// ── 6. Routing config ─────────────────────────────────────────────────────────
writeFileSync(join(out, "config.json"), JSON.stringify({
  version: 3,
  routes: [
    { src: "^/assets/(.*)$", headers: { "cache-control": "public, max-age=31536000, immutable" }, continue: true },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__server" },
  ],
}, null, 2));
console.log("  ✓ Wrote config.json");
console.log("\n✅ .vercel/output/ is ready");
