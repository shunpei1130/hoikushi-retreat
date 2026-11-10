export const MAX_CHAT_MESSAGES = 12;
export const MAX_CHAT_MESSAGE_CHARS = 1500;
export const DEFAULT_OPENAI_MODEL = "gpt-6-luna";

export class ChatServiceError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.name = "ChatServiceError";
    this.code = code;
    this.status = status;
  }
}

export function toPublicChatError(error) {
  if (!(error instanceof ChatServiceError)) {
    return { status: 502, message: "AIから回答を取得できませんでした。時間をおいて再度お試しください。" };
  }
  const messages = {
    missing_api_key: "AIチャットは未設定です。管理者は .env に OPENAI_API_KEY を設定してサーバーを再起動してください。",
    invalid_messages: "会話の形式が正しくありません。ページを再読み込みしてお試しください。",
    invalid_role: "会話の形式が正しくありません。ページを再読み込みしてお試しください。",
    invalid_content: "相談内容を確認して、もう一度お試しください。",
    invalid_content_length: "相談内容は1,500文字以内で入力してください。",
    invalid_message_order: "会話の形式が正しくありません。ページを再読み込みしてお試しください。",
    last_message_must_be_user: "相談内容を入力してから送信してください。",
    invalid_json: "送信内容を読み取れませんでした。もう一度お試しください。",
    body_too_large: "送信できる会話量を超えました。ページを再読み込みしてお試しください。",
    request_error: "送信できませんでした。時間をおいて再度お試しください。",
    provider_timeout: "回答に時間がかかっています。時間をおいて再度お試しください。",
    provider_rate_limited: "現在AIの利用が集中しています。少し時間をおいて再度お試しください。",
    provider_unavailable: "AIサービスへ接続できませんでした。少し時間をおいて再度お試しください。",
    provider_error: "AIの設定を確認できませんでした。LINE相談もご利用いただけます。",
    empty_response: "回答を取得できませんでした。LINE相談もご利用いただけます。",
  };
  return {
    status: error.status,
    message: messages[error.code] || "送信できませんでした。時間をおいて再度お試しください。",
  };
}

export function validateChatMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_CHAT_MESSAGES) {
    throw new ChatServiceError("invalid_messages", 400);
  }

  const normalized = messages.map((message, index) => {
    if (!message || !["user", "assistant"].includes(message.role)) {
      throw new ChatServiceError("invalid_role", 400);
    }
    if (typeof message.content !== "string") {
      throw new ChatServiceError("invalid_content", 400);
    }
    const content = message.content.trim();
    if (!content || content.length > MAX_CHAT_MESSAGE_CHARS) {
      throw new ChatServiceError("invalid_content_length", 400);
    }
    if (index > 0 && messages[index - 1]?.role === message.role) {
      throw new ChatServiceError("invalid_message_order", 400);
    }
    return { role: message.role, content };
  });

  if (normalized.at(-1)?.role !== "user") {
    throw new ChatServiceError("last_message_must_be_user", 400);
  }
  return normalized;
}

function yen(amount) {
  return `¥${new Intl.NumberFormat("ja-JP").format(amount)}`;
}

export function buildChatInstructions(config = {}) {
  const facts = [];
  const consultationItems = new Map(
    (config.pricing?.items || []).map((item) => [item.id, item]),
  );
  const allConsultationsFree = ["ai-fee", "line-fee", "phone-fee"].every((id) => {
    const item = consultationItems.get(id);
    return item?.verified === true && item.amount === 0;
  });
  if (allConsultationsFree) facts.push("AI・LINE・電話の相談料は無料です。");

  const total = config.pricing?.total ?? {};
  if (total.verified === true && typeof total.fixedAmount === "number") {
    const taxText = config.pricing?.taxStatus === "included" ? "税込" : "税区分は未確認";
    facts.push(
      `退職支援の総額は、条件「${total.condition || "条件未記載"}」の場合に${yen(total.fixedAmount)}（${taxText}）です。${total.note || "条件の詳細は未確認です。"}`,
    );
  }

  const line = config.channels?.line ?? {};
  if (line.id) {
    facts.push(
      `LINE IDは ${line.id} です。${line.verified === true ? "アカウント確認済みです。" : "このIDは提供情報ですが、アカウントの稼働確認は未完了です。"}`,
    );
    if (line.verified === true) {
      facts.push(
        "正式にご依頼いただく場合の流れは、公式LINE追加後、ヒアリングシート（Googleフォーム）を記入し、プランに応じた料金をお支払いいただく流れです。",
      );
    }
  }
  const phone = config.channels?.phone ?? {};
  if (phone.requestViaLine === true) {
    facts.push(
      "電話相談を希望する場合は、LINEを追加後「電話相談希望」と送信し、返信で進め方の案内を受けます。電話番号や相談日時など、未設定の情報は推測しないでください。",
    );
  }
  if (config.operator?.type === "labor_union") {
    facts.push(
      "違法性について：当サービスは団体交渉権を持つ労働組合が運営（公立保育園は提携弁護士が対応）しており、弁護士法第72条（非弁行為）に違反せず法的に適法です。年度途中・1年目・担任ありでも退職手続きを進められます。",
      "追加料金について：LINE・電話・AI相談は完全無料（0円）で、正式依頼時も組合費込みの税込総額表示のみです。後から追加でお金を取られることは一切なく（追加費用0円）、全額返金保証・あと払いにも対応しています。",
      "訴えられる不安について：退職は労働者の法的権利であり、通常の退職で保育士個人が園から損害賠償請求や訴訟をされる心配はありません。引き止めや脅しにも組合（公立は提携弁護士）が対応します。",
      "親バレ・職場バレについて：秘密厳守を徹底しており、本人の同意なく勤務先や家族へ連絡することはありません。退職代行時も本人や親・実家・緊急連絡先へ直接連絡しないよう園へ通達し、退職届や貸与物返却・私物回収もすべて郵送で完結するため親にバレずに退職できます。",
    );
  }

  return [
    "あなたは保育士の退職や職場の悩みについて、利用者の考えを整理する日本語のAIアシスタントです。人間の相談員、弁護士、社労士などを名乗ってはいけません。",
    "短く、落ち着いて、押しつけずに答えてください。退職を勧めたり、特定の日に退職できると保証したりしないでください。法律の個別適用、交渉の結果、雇用契約の結論を断定しないでください。",
    "下記のサービス情報だけを事実として案内してください。未記載・未確認の料金、受付時間、組合情報、スタッフ情報、対応可否は作らず、確認できないと伝えてください。支援の申込み、LINE送信、電話、支払い、組合加入を実行したと装わないでください。",
    "氏名、園名、園児・保護者・同僚の個人情報を尋ねないでください。ユーザーが入力した場合は必要以上に繰り返さず、削除して再入力するよう促してください。",
    "切迫した危険や自傷のおそれがある場合は、営業案内より先に、身近な信頼できる人や地域の緊急窓口へすぐつながるよう促してください。",
    "確認できているサービス情報：",
    ...(facts.length > 0 ? facts.map((fact) => `- ${fact}`) : ["- 具体的なサービス条件は未確認です。"]),
    "情報不足のときは、その旨を明示し、必要ならLINEで人に相談する選択肢を案内してください。",
  ].join("\n");
}

export function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const text = (payload?.output || [])
    .filter((item) => item?.type === "message")
    .flatMap((item) => item.content || [])
    .filter((item) => item?.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
  return text;
}

export async function requestOpenAIResponse({
  messages,
  apiKey,
  model = DEFAULT_OPENAI_MODEL,
  config = {},
  fetchImpl = fetch,
  signal,
}) {
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new ChatServiceError("missing_api_key", 503);
  }
  const normalized = validateChatMessages(messages);
  let response;
  try {
    response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || DEFAULT_OPENAI_MODEL,
        instructions: buildChatInstructions(config),
        input: normalized,
        max_output_tokens: 600,
        store: false,
      }),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      throw new ChatServiceError("provider_timeout", 504);
    }
    throw new ChatServiceError("provider_unavailable", 502);
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Keep upstream error bodies out of the browser and application logs.
  }
  if (!response.ok) {
    throw new ChatServiceError(response.status === 429 ? "provider_rate_limited" : "provider_error", 502);
  }

  const answer = extractResponseText(payload);
  if (!answer) throw new ChatServiceError("empty_response", 502);
  return answer;
}
