import config from "../site.config.json" with { type: "json" };
import { ChatServiceError, requestOpenAIResponse, toPublicChatError } from "../scripts/lib/chat.mjs";

const MAX_CHAT_BODY_BYTES = 24 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 8;

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

async function readJsonRequest(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_CHAT_BODY_BYTES) {
    throw new ChatServiceError("body_too_large", 413);
  }
  if (!request.body) throw new ChatServiceError("invalid_json", 400);

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_CHAT_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      throw new ChatServiceError("body_too_large", 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ChatServiceError("invalid_json", 400);
  }
}

function allowRequest(rateLimits, client, now) {
  const current = rateLimits.get(client);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateLimits.set(client, { startedAt: now, count: 1 });
  } else if (current.count >= RATE_LIMIT) {
    return false;
  } else {
    current.count += 1;
  }

  if (rateLimits.size > 2000) {
    for (const [key, value] of rateLimits) {
      if (now - value.startedAt >= RATE_WINDOW_MS) rateLimits.delete(key);
    }
    if (rateLimits.size > 2000) rateLimits.delete(rateLimits.keys().next().value);
  }
  return true;
}

function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function createVercelChatHandler({
  env = process.env,
  serviceConfig = config,
  fetchImpl = fetch,
  rateLimits = new Map(),
  now = () => Date.now(),
} = {}) {
  return {
    async fetch(request) {
      if (new URL(request.url).pathname !== "/api/chat") {
        return json({ error: "Not found" }, 404);
      }
      if (request.method !== "POST") {
        return json({ error: "この方法では送信できません。" }, 405);
      }
      if (!isSameOrigin(request)) {
        return json({ error: "この送信元からは利用できません。" }, 403);
      }
      if (!String(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
        return json({ error: "JSON形式で送信してください。" }, 415);
      }
      if (!env.OPENAI_API_KEY) {
        return json({ error: "AIチャットは未設定です。Vercelの環境変数 OPENAI_API_KEY を設定してください。" }, 503);
      }

      const forwardedFor = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "unknown";
      const client = forwardedFor.split(",")[0].trim().slice(0, 100) || "unknown";
      if (!allowRequest(rateLimits, client, now())) {
        return json({ error: "送信が続いています。10分ほど待ってから再度お試しください。" }, 429);
      }

      try {
        const body = await readJsonRequest(request);
        const answer = await requestOpenAIResponse({
          messages: body.messages,
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL,
          config: serviceConfig,
          fetchImpl,
          signal: AbortSignal.timeout(25_000),
        });
        return json({ answer });
      } catch (error) {
        const safeError = toPublicChatError(error);
        if (error instanceof ChatServiceError && error.code.startsWith("provider_")) {
          console.warn(`[ai-chat] upstream error (${error.code}, status ${error.status})`);
        }
        return json({ error: safeError.message }, safeError.status);
      }
    },
  };
}

export default createVercelChatHandler();
