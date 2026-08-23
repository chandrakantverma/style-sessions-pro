/**
 * vercel-build.mjs
 *
 * Builds the app with Vite, then bundles dist/server/server.js + all its
 * node_modules into a single self-contained CJS file using esbuild.
 * Wraps it with a (req, res) → fetch adapter for Vercel's Node.js runtime.
 * Outputs to .vercel/output/ (Vercel Build Output API v3).
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

const root    = process.cwd();
const dist    = resolve(root, "dist");
const out     = resolve(root, ".vercel/output");
const funcDir = join(out, "functions/__server.func");

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

// ── 4. Bundle server into a single CJS file ───────────────────────────────────
// We write a CJS adapter entry next to server.js so relative imports resolve.
const serverEntry = join(dist, "server", "server.js");
if (!existsSync(serverEntry)) { console.error("✗ dist/server/server.js missing"); process.exit(1); }

const adapterSrc = join(dist, "server", "_vercel_entry.cjs");
writeFileSync(adapterSrc, `
"use strict";
// Dynamic import of the ESM server bundle
let _handler = null;
async function getHandler() {
  if (!_handler) {
    const mod = await import("./server.js");
    const bundle = mod.default ?? mod;
    _handler = bundle.default ?? bundle;
  }
  return _handler;
}

const { Readable } = require("node:stream");

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

module.exports = async function handler(req, res) {
  try {
    const h = await getHandler();
    const webRes = await h.fetch(await toWebRequest(req));
    await sendResponse(webRes, res);
  } catch (err) {
    console.error("[ssr error]", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain");
      res.end("Internal Server Error");
    }
  }
};
`.trimStart());

// Copy the whole dist/server dir so server.js + assets are next to the adapter
cpSync(join(dist, "server"), funcDir, { recursive: true });

// Write the CJS adapter as index.cjs (separate from the ESM server.js)
const indexCjs = join(funcDir, "index.cjs");
execSync(
  `"${join(root, "node_modules/.bin/esbuild")}" "${adapterSrc}" \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile="${indexCjs}" \
    --external:node:* \
    --external:./server.js \
    --log-level=warning`,
  { stdio: "inherit" }
);

console.log("  ✓ Bundled adapter → __server.func/index.cjs");

// .vc-config.json — use index.cjs as the handler (CJS, no type:module needed)
writeFileSync(join(funcDir, ".vc-config.json"), JSON.stringify({
  runtime: "nodejs20.x",
  handler: "index.cjs",
  launcherType: "Nodejs",
  shouldAddHelpers: true,
  supportsResponseStreaming: true,
}, null, 2));

// package.json with type:module so Node treats server.js as ESM
writeFileSync(join(funcDir, "package.json"), JSON.stringify({ type: "module" }, null, 2));

console.log("  ✓ Wrote .vc-config.json + package.json");

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
console.log("\n✅ .vercel/output/ is ready");
