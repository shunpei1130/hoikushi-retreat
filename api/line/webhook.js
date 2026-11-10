import config from "../../site.config.json" with { type: "json" };
import { LineWebhookError, processLineWebhook } from "../../scripts/lib/line-webhook.mjs";

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;

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

async function readRawRequest(request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
    throw new LineWebhookError("body_too_large", 413);
  }
  if (!request.body) throw new LineWebhookError("invalid_json", 400);

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_WEBHOOK_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      throw new LineWebhookError("body_too_large", 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export function createVercelLineWebhookHandler({
  env = process.env,
  serviceConfig = config,
  fetchImpl = fetch,
} = {}) {
  return {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname !== "/api/line/webhook" && pathname !== "/api/line-webhook") {
        return json({ error: "Not found" }, 404);
      }
      if (request.method !== "POST") {
        return json({ error: "Method Not Allowed" }, 405);
      }

      const signature = request.headers.get("x-line-signature") || "";

      try {
        const rawBody = await readRawRequest(request);
        const result = await processLineWebhook({
          rawBody,
          signature,
          env,
          config: serviceConfig,
          fetchImpl,
          signal: AbortSignal.timeout(20_000),
        });
        return json({ status: "ok", notified: result.notified });
      } catch (error) {
        if (error instanceof LineWebhookError) {
          console.warn(`[line-webhook] error (${error.code}, status ${error.status})`);
          return json({ error: error.code }, error.status);
        }
        console.error("[line-webhook] unexpected error", error);
        return json({ error: "internal_error" }, 500);
      }
    },
  };
}

export default createVercelLineWebhookHandler();
