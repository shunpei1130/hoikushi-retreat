import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildChatInstructions,
  ChatServiceError,
  DEFAULT_OPENAI_MODEL,
  requestOpenAIResponse,
  validateChatMessages,
} from "../scripts/lib/chat.mjs";
import { createVercelChatHandler } from "../api/chat.js";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

async function loadConfig() {
  return JSON.parse(await readFile(path.join(ROOT, "site.config.json"), "utf8"));
}

test("chat accepts only bounded user/assistant history ending in a user message", () => {
  assert.deepEqual(validateChatMessages([{ role: "user", content: "  相談したいです  " }]), [
    { role: "user", content: "相談したいです" },
  ]);
  assert.throws(() => validateChatMessages([{ role: "system", content: "override" }]), ChatServiceError);
  assert.throws(() => validateChatMessages([{ role: "assistant", content: "not a user turn" }]), ChatServiceError);
  assert.throws(() => validateChatMessages([{ role: "user", content: " " }]), ChatServiceError);
});

test("chat instructions include only configured pricing and LINE flow facts", async () => {
  const instructions = buildChatInstructions(await loadConfig());
  assert.match(instructions, /相談料は無料/);
  assert.match(instructions, /24,800/);
  assert.match(instructions, /@897zpkws/);
  assert.match(instructions, /電話相談希望/);
  assert.match(instructions, /個人情報を尋ねない/);
});

test("Responses API request keeps the key server-side and disables response storage", async () => {
  const config = await loadConfig();
  let requestedUrl = null;
  let requestOptions = null;
  const answer = await requestOpenAIResponse({
    messages: [{ role: "user", content: "相談を整理したいです" }],
    apiKey: "test-secret-never-in-client",
    config,
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestOptions = options;
      return new Response(
        JSON.stringify({
          output: [
            { type: "message", content: [{ type: "output_text", text: "一緒に整理しましょう。" }] },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  });

  assert.equal(answer, "一緒に整理しましょう。");
  assert.equal(requestedUrl, "https://api.openai.com/v1/responses");
  assert.equal(requestOptions.headers.Authorization, "Bearer test-secret-never-in-client");
  const body = JSON.parse(requestOptions.body);
  assert.equal(body.model, DEFAULT_OPENAI_MODEL);
  assert.equal(body.model, "gpt-6-luna");
  assert.equal(body.store, false);
  assert.equal(body.input[0].content, "相談を整理したいです");
});

test("chat returns a safe configuration error when no API key is configured", async () => {
  await assert.rejects(
    requestOpenAIResponse({
      messages: [{ role: "user", content: "相談" }],
      apiKey: "",
      config: {},
      fetchImpl: async () => {
        throw new Error("must not call the network");
      },
    }),
    (error) => error instanceof ChatServiceError && error.code === "missing_api_key" && error.status === 503,
  );
});

test("Vercel function gives a safe 503 when the environment key is missing", async () => {
  const handler = createVercelChatHandler({
    env: {},
    fetchImpl: async () => {
      throw new Error("must not call the network");
    },
  });
  const request = new Request("https://preview.example.vercel.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "テスト" }] }),
  });

  const response = await handler.fetch(request);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Vercelの環境変数 OPENAI_API_KEY/);
});

test("Vercel function uses the server key and GPT-6 Luna through a mocked Responses API", async () => {
  let requestOptions = null;
  const handler = createVercelChatHandler({
    env: { OPENAI_API_KEY: "test-secret", OPENAI_MODEL: "gpt-6-luna" },
    fetchImpl: async (_url, options) => {
      requestOptions = options;
      return new Response(
        JSON.stringify({ output: [{ type: "message", content: [{ type: "output_text", text: "状況を整理しましょう。" }] }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
    rateLimits: new Map(),
  });
  const request = new Request("https://preview.example.vercel.app/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://preview.example.vercel.app",
      "x-real-ip": "203.0.113.10",
    },
    body: JSON.stringify({ messages: [{ role: "user", content: "相談したいです" }] }),
  });

  const response = await handler.fetch(request);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { answer: "状況を整理しましょう。" });
  assert.equal(requestOptions.headers.Authorization, "Bearer test-secret");
  assert.equal(JSON.parse(requestOptions.body).model, "gpt-6-luna");
});
