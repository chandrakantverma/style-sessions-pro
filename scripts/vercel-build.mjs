/**
 * vercel-build.mjs
 *
 * TanStack Start (1.168.x) always outputs to dist/client + dist/server regardless
 * of NITRO_PRESET. This script runs after `vite build` and restructures the output
 * into Vercel's Build Output API v3 format:
 *
 *   .vercel/output/
 *     config.json                    — routing config
 *     static/                        — served directly by Vercel's CDN
 *     functions/
 *       __server.func/
 *         index.js                   — Node (req,res) adapter → fetch handler
 *         server.js + assets/        — TanStack Start SSR bundle
 *         .vc-config.json            — Vercel function config
 *
 * TanStack Start's server.js exports a Web Fetch API handler:
 *   export default { fetch(request: Request): Promise<Response> }
 *
 * Vercel's Node.js runtime calls: handler(req: IncomingMessage, res: ServerResponse)
 * The index.js adapter bridges between the two.
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

// Write the Node.js adapter that bridges (req, res) → Web Fetch API.
// TanStack Start's server.js exports { default: { fetch(req): Promise<Response> } }
// Vercel's Node.js runtime calls module.exports(req, res).
writeFileSync(
  join(out, "functions/__server.func/index.js"),
  `import { Readable } from "node:stream";
import startHandler from "./server.js";

// The actual fetch handler exported by TanStack Start
const handler = startHandler.default ?? startHandler;

/**
 * Convert a Node.js IncomingMessage to a Web API Request.
 */
async function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = new URL(req.url, protocol + "://" + host);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const method = (req.method || "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? Readable.toWeb(req) : undefined;

  return new Request(url.toString(), {
    method,
    headers,
    ...(body ? { body, duplex: "half" } : {}),
  });
}

/**
 * Stream a Web API Response back into a Node.js ServerResponse.
 */
async function sendWebResponse(webRes, res) {
  res.statusCode = webRes.status;
  for (const [key, value] of webRes.headers.entries()) {
    res.setHeader(key, value);
  }
  if (webRes.body) {
    const reader = webRes.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await new Promise((resolve, reject) => {
          res.write(value, (err) => (err ? reject(err) : resolve()));
        });
      }
    } finally {
      reader.releaseLock();
    }
  }
  res.end();
}

/**
 * Vercel serverless function entry point.
 */
export default async function vercelHandler(req, res) {
  try {
    const webRequest = await toWebRequest(req);
    const webResponse = await handler.fetch(webRequest);
    await sendWebResponse(webResponse, res);
  } catch (err) {
    console.error("[ssr error]", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain");
      res.end("Internal Server Error");
    }
  }
}
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
        // Immutable cache for hashed assets
        {
          src: "^/assets/(.*)$",
          headers: { "cache-control": "public, max-age=31536000, immutable" },
          continue: true,
        },
        // Serve static files (favicon, robots.txt, etc.) directly
        {
          handle: "filesystem",
        },
        // All other requests → SSR function
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
