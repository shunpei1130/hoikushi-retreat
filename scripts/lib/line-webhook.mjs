import { createHmac, timingSafeEqual } from "node:crypto";
import { escapeHtml } from "./html.mjs";

export const DEFAULT_NOTIFY_FROM_EMAIL = "onboarding@resend.dev";

export class LineWebhookError extends Error {
  constructor(code, status = 500, message = code) {
    super(message);
    this.name = "LineWebhookError";
    this.code = code;
    this.status = status;
  }
}

export function verifyLineSignature(rawBody, signature, channelSecret) {
  if (typeof channelSecret !== "string" || !channelSecret.trim()) {
    throw new LineWebhookError("missing_channel_secret", 503, "LINE_CHANNEL_SECRET is not configured");
  }
  if (typeof signature !== "string" || !signature.trim()) {
    return false;
  }

  const expected = createHmac("sha256", channelSecret.trim())
    .update(rawBody, "utf8")
    .digest("base64");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature.trim(), "utf8");
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, actualBuf);
}

export async function fetchLineProfile({
  userId,
  accessToken,
  fetchImpl = fetch,
  signal,
}) {
  if (!userId || typeof accessToken !== "string" || !accessToken.trim()) {
    return null;
  }
  try {
    const response = await fetchImpl(
      `https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
        },
        signal,
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || typeof data.displayName !== "string") return null;
    return {
      userId: data.userId || userId,
      displayName: data.displayName,
      pictureUrl: typeof data.pictureUrl === "string" ? data.pictureUrl : null,
      statusMessage: typeof data.statusMessage === "string" ? data.statusMessage : null,
    };
  } catch {
    return null;
  }
}

function formatJstTimestamp(timestamp) {
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date();
  if (Number.isNaN(date.getTime())) return "不明";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function buildFollowNotificationEmail({ event, profile, config = {}, env = {} }) {
  const brandName = config.brandName || "保育士リトリート";
  const accountName = config.channels?.line?.accountName || brandName;
  const lineId = config.channels?.line?.id || "";
  const displayName = profile?.displayName || "（表示名未取得）";
  const userId = event?.source?.userId || "不明";
  const isUnblocked = Boolean(event?.follow?.isUnblocked);
  const followTypeLabel = isUnblocked ? "ブロック解除（再登録）" : "新規友だち追加";
  const timestampText = formatJstTimestamp(event?.timestamp);

  const from = (env.NOTIFY_FROM_EMAIL || DEFAULT_NOTIFY_FROM_EMAIL).trim();
  const to = String(env.NOTIFY_TO_EMAIL || "")
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  if (to.length === 0) {
    throw new LineWebhookError("missing_notify_to_email", 503, "NOTIFY_TO_EMAIL is not configured");
  }

  const subject = `【${brandName}】LINE友だち追加通知（${displayName}様）`;
  const text = [
    `${accountName}${lineId ? ` (${lineId})` : ""} にLINE友だち追加がありました。`,
    "",
    `・LINE表示名: ${displayName}`,
    `・種別: ${followTypeLabel}`,
    `・追加日時: ${timestampText} (JST)`,
    `・User ID: ${userId}`,
    ...(profile?.statusMessage ? [`・ステータスメッセージ: ${profile.statusMessage}`] : []),
    "",
    "LINE Official Account Manager からチャットを確認してください：",
    "https://manager.line.biz/",
  ].join("\n");

  const html = `
    <div style="font-family: sans-serif; color: #222; line-height: 1.6; max-width: 600px;">
      <h2 style="color: #1D6258; font-size: 18px; margin-bottom: 12px;">
        ${escapeHtml(accountName)}${lineId ? ` (${escapeHtml(lineId)})` : ""} に友だち追加がありました
      </h2>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
        <tbody>
          <tr>
            <th style="text-align: left; padding: 8px 12px; border: 1px solid #ddd; background: #f8f6f2; width: 140px;">LINE表示名</th>
            <td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${escapeHtml(displayName)}</strong></td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px 12px; border: 1px solid #ddd; background: #f8f6f2;">種別</th>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(followTypeLabel)}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px 12px; border: 1px solid #ddd; background: #f8f6f2;">追加日時</th>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(timestampText)} (JST)</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 8px 12px; border: 1px solid #ddd; background: #f8f6f2;">User ID</th>
            <td style="padding: 8px 12px; border: 1px solid #ddd; font-family: monospace;">${escapeHtml(userId)}</td>
          </tr>
          ${
            profile?.statusMessage
              ? `<tr>
            <th style="text-align: left; padding: 8px 12px; border: 1px solid #ddd; background: #f8f6f2;">ステータス</th>
            <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(profile.statusMessage)}</td>
          </tr>`
              : ""
          }
        </tbody>
      </table>
      <p style="margin-top: 16px;">
        <a href="https://manager.line.biz/" style="display: inline-block; padding: 10px 16px; background: #1D6258; color: #fff; text-decoration: none; border-radius: 6px;">
          LINE Official Account Manager を開く
        </a>
      </p>
    </div>
  `.trim();

  return { from, to, subject, text, html };
}

export async function sendResendEmail({
  apiKey,
  email,
  fetchImpl = fetch,
  signal,
}) {
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new LineWebhookError("missing_resend_api_key", 503, "RESEND_API_KEY is not configured");
  }

  let response;
  try {
    response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      throw new LineWebhookError("email_timeout", 504, "Email provider timed out");
    }
    throw new LineWebhookError("email_unavailable", 502, "Failed to reach email provider");
  }

  if (!response.ok) {
    throw new LineWebhookError("email_provider_error", 502, `Resend responded with status ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

export async function processLineWebhook({
  rawBody,
  signature,
  env = process.env,
  config = {},
  fetchImpl = fetch,
  signal,
}) {
  const isValid = verifyLineSignature(rawBody, signature, env.LINE_CHANNEL_SECRET);
  if (!isValid) {
    throw new LineWebhookError("invalid_signature", 401, "Invalid LINE webhook signature");
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new LineWebhookError("invalid_json", 400, "Invalid JSON body");
  }

  const events = Array.isArray(payload?.events) ? payload.events : [];
  const followEvents = events.filter((event) => event && event.type === "follow");

  // LINE Developersの「検証」ボタン等、followイベントが含まれない場合はメール設定チェック前に200 OKを返す
  if (followEvents.length === 0) {
    return { notified: 0 };
  }

  let notified = 0;
  for (const event of followEvents) {
    const userId = event.source?.userId;
    const profile = await fetchLineProfile({
      userId,
      accessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
      fetchImpl,
      signal,
    });
    const email = buildFollowNotificationEmail({
      event,
      profile,
      config,
      env,
    });
    await sendResendEmail({
      apiKey: env.RESEND_API_KEY,
      email,
      fetchImpl,
      signal,
    });
    notified += 1;
  }

  return { notified };
}
