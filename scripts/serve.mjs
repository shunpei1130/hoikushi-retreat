import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./lib/config.mjs";
import { ChatServiceError, requestOpenAIResponse, toPublicChatError } from "./lib/chat.mjs";
import { LineWebhookError, processLineWebhook } from "./lib/line-webhook.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const MAX_CHAT_BODY_BYTES = 24 * 1024;
const CHAT_RATE_WINDOW_MS = 10 * 60 * 1000;
const CHAT_RATE_LIMIT = 8;
const chatRateLimits = new Map();
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function args(argv) {
  const options = { dir: "dist/preview", port: 4173, host: "127.0.0.1" };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--dir=")) options.dir = arg.slice(6);
    else if (arg.startsWith("--port=")) options.port = Number(arg.slice(7));
    else if (arg.startsWith("--host=")) options.host = arg.slice(7);
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/serve.mjs [--dir=dist/preview] [--port=4173] [--host=127.0.0.1]");
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

async function loadLocalEnv() {
  let source;
  try {
    source = await readFile(path.join(ROOT, ".env"), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_CHAT_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) {
        chunks.push(chunk);
      }
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(new ChatServiceError("body_too_large", 413));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new ChatServiceError("invalid_json", 400));
      }
    });
    request.on("error", () => reject(new ChatServiceError("request_error", 400)));
  });
}

function readRawBody(request, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) {
        chunks.push(chunk);
      }
    });
    request.on("end", () => {
      if (tooLarge) {
        reject(new LineWebhookError("body_too_large", 413));
        return;
      }
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", () => reject(new LineWebhookError("request_error", 400)));
  });
}

function allowChatRequest(client) {
  const now = Date.now();
  const current = chatRateLimits.get(client);
  if (!current || now - current.startedAt >= CHAT_RATE_WINDOW_MS) {
    chatRateLimits.set(client, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= CHAT_RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

function safePath(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(root, normalized);
  if (!target.startsWith(root + path.sep) && target !== root) return null;
  return target;
}

async function resolveFile(root, requestPath) {
  const target = safePath(root, requestPath);
  if (!target) return null;
  const candidates = [target];
  if (requestPath.endsWith("/")) candidates.push(path.join(target, "index.html"));
  else if (!path.extname(target)) {
    candidates.push(path.join(target, "index.html"), `${target}.html`);
  }
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

const options = args(process.argv);
const root = path.resolve(ROOT, options.dir);
await loadLocalEnv();
const config = await loadConfig();

const server = createServer(async (request, response) => {
  const requestPath = (request.url || "/").split("?")[0];
  if (requestPath === "/api/line/webhook" || requestPath === "/api/line-webhook") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "Method Not Allowed" });
      return;
    }
    try {
      const rawBody = await readRawBody(request);
      const signature = String(request.headers["x-line-signature"] || "");
      const result = await processLineWebhook({
        rawBody,
        signature,
        env: process.env,
        config,
        signal: AbortSignal.timeout(20000),
      });
      sendJson(response, 200, { status: "ok", notified: result.notified });
    } catch (error) {
      if (error instanceof LineWebhookError) {
        sendJson(response, error.status, { error: error.code });
      } else {
        sendJson(response, 500, { error: "internal_error" });
      }
    }
    return;
  }
  if (requestPath === "/api/chat") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "この方法では送信できません。" });
      return;
    }
    const origin = request.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== request.headers.host) {
          sendJson(response, 403, { error: "この送信元からは利用できません。" });
          return;
        }
      } catch {
        sendJson(response, 403, { error: "この送信元からは利用できません。" });
        return;
      }
    }
    if (!String(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
      sendJson(response, 415, { error: "JSON形式で送信してください。" });
      return;
    }
    if (!process.env.OPENAI_API_KEY) {
      request.resume();
      const error = toPublicChatError(new ChatServiceError("missing_api_key", 503));
      sendJson(response, error.status, { error: error.message });
      return;
    }
    const client = request.socket.remoteAddress || "unknown";
    if (!allowChatRequest(client)) {
      request.resume();
      sendJson(response, 429, { error: "送信が続いています。10分ほど待ってから再度お試しください。" });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const answer = await requestOpenAIResponse({
        messages: body.messages,
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL,
        config,
        signal: AbortSignal.timeout(45000),
      });
      sendJson(response, 200, { answer });
    } catch (error) {
      const safeError = toPublicChatError(error);
      if (error instanceof ChatServiceError && error.code.startsWith("provider_")) {
        console.warn(`[ai-chat] upstream error (${error.code}, status ${error.status})`);
      }
      sendJson(response, safeError.status, { error: safeError.message });
    }
    return;
  }

  const file = await resolveFile(root, requestPath);
  if (!file) {
    const notFound = path.join(root, "404.html");
    try {
      const body = await stat(notFound);
      if (body.isFile()) {
        response.writeHead(404, {
          "Content-Type": MIME[".html"],
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        });
        createReadStream(notFound).pipe(response);
        return;
      }
    } catch {
      // fall through
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(file).toLowerCase();
  response.writeHead(200, {
    "Content-Type": MIME[extension] || "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=60",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
  });
  createReadStream(file).pipe(response);
});

server.listen(options.port, options.host, () => {
  console.log(`Serving ${path.relative(ROOT, root) || "."} at http://${options.host}:${options.port}/`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
