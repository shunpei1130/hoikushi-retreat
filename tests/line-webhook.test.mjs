import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFollowNotificationEmail,
  processLineWebhook,
  verifyLineSignature,
} from "../scripts/lib/line-webhook.mjs";
import { createVercelLineWebhookHandler } from "../api/line/webhook.js";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

async function loadConfig() {
  return JSON.parse(await readFile(path.join(ROOT, "site.config.json"), "utf8"));
}

function signBody(body, secret) {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

test("verifyLineSignature validates HMAC-SHA256 signatures accurately", () => {
  const secret = "test-channel-secret";
  const rawBody = JSON.stringify({ events: [] });
  const validSig = signBody(rawBody, secret);

  assert.equal(verifyLineSignature(rawBody, validSig, secret), true);
  assert.equal(verifyLineSignature(rawBody, "invalid-signature", secret), false);
  assert.equal(verifyLineSignature(rawBody, "", secret), false);
});

test("processLineWebhook returns notified: 0 on empty events (LINE Verify button)", async () => {
  const secret = "test-channel-secret";
  const rawBody = JSON.stringify({ destination: "U123456", events: [] });
  const signature = signBody(rawBody, secret);

  const result = await processLineWebhook({
    rawBody,
    signature,
    env: { LINE_CHANNEL_SECRET: secret },
    fetchImpl: async () => {
      throw new Error("must not call external APIs when there are no follow events");
    },
  });

  assert.deepEqual(result, { notified: 0 });
});

test("Vercel LINE webhook handler fetches profile and sends email via Resend on follow event", async () => {
  const config = await loadConfig();
  const secret = "line-secret-key";
  const rawBody = JSON.stringify({
    destination: "Uxxxxxx",
    events: [
      {
        type: "follow",
        timestamp: 1762765200000,
        source: { type: "user", userId: "U_USER_001" },
        follow: { isUnblocked: false },
      },
    ],
  });
  const signature = signBody(rawBody, secret);

  const calls = [];
  const handler = createVercelLineWebhookHandler({
    env: {
      LINE_CHANNEL_SECRET: secret,
      LINE_CHANNEL_ACCESS_TOKEN: "line-access-token",
      RESEND_API_KEY: "re_test_key",
      NOTIFY_FROM_EMAIL: "onboarding@resend.dev",
      NOTIFY_TO_EMAIL: "admin@example.com",
    },
    serviceConfig: config,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (String(url).startsWith("https://api.line.me/v2/bot/profile/")) {
        return new Response(
          JSON.stringify({
            userId: "U_USER_001",
            displayName: "さくら先生",
            statusMessage: "よろしくおねがいします",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === "https://api.resend.com/emails") {
        return new Response(JSON.stringify({ id: "email_123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  });

  const request = new Request("https://hoiku-retreat.app/api/line/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-line-signature": signature,
    },
    body: rawBody,
  });

  const response = await handler.fetch(request);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", notified: 1 });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://api.line.me/v2/bot/profile/U_USER_001");
  assert.equal(calls[1].url, "https://api.resend.com/emails");

  const resendPayload = JSON.parse(calls[1].options.body);
  assert.deepEqual(resendPayload.to, ["admin@example.com"]);
  assert.match(resendPayload.subject, /さくら先生/);
  assert.match(resendPayload.text, /新規友だち追加/);
});

test("buildFollowNotificationEmail escapes HTML in displayName and statusMessage", () => {
  const email = buildFollowNotificationEmail({
    event: {
      type: "follow",
      timestamp: 1762765200000,
      source: { userId: "U123" },
      follow: { isUnblocked: true },
    },
    profile: {
      displayName: "<script>alert(1)</script>",
      statusMessage: "<b>test</b>",
    },
    config: { brandName: "保育士リトリート" },
    env: { NOTIFY_TO_EMAIL: "notify@example.com" },
  });

  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(email.text, /ブロック解除（再登録）/);
});
