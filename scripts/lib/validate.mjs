import { getByPath, isFilled, normalizeOrigin } from "./config.mjs";

const PLACEHOLDER_PATTERNS = [
  /TODO/i,
  /TBD/i,
  /\[\[/,
  /example\.(com|org|net)/i,
  /\.invalid(\/|$)/i,
  /\blocalhost\b/i,
  /127\.0\.0\.1/,
  /サンプル/,
  /ダミー/,
  /仮の/,
  /確認中/,
  /プレビュー/,
];

const PLACEHOLDER_PHONE_PATTERNS = [
  /^0{2,}/,
  /0{4,}/,
  /1234-?5678/,
  /0120-?000/,
  /03-?0000/,
  /090-?0000/,
];

const REQUIRED_FIELDS = [
  { group: "公開設定", path: "canonicalOrigin", label: "公開ドメイン（https）", type: "origin" },
  { group: "公開設定", path: "contentUpdatedAt", label: "コンテンツ更新日", type: "date" },
  { group: "運営者", path: "operator.legalName", label: "労働組合の正式名称" },
  { group: "運営者", path: "operator.address", label: "所在地" },
  { group: "運営者", path: "operator.responsiblePerson", label: "責任者" },
  { group: "運営者", path: "operator.contact", label: "問い合わせ先" },
  { group: "運営者", path: "operator.hours", label: "受付時間" },
  { group: "AIチャット", path: "channels.ai.provider", label: "AI提供事業者" },
  { group: "AIチャット", path: "channels.ai.feeDisclosure", label: "AI利用料の表示" },
  { group: "AIチャット", path: "channels.ai.hoursDisclosure", label: "AIの利用可能時間" },
  { group: "AIチャット", path: "channels.ai.requiresAccount", label: "AIのアカウント要否", type: "boolean" },
  { group: "LINE相談", path: "channels.line.url", label: "LINE公式アカウントURL", type: "url" },
  { group: "LINE相談", path: "channels.line.id", label: "LINE公式アカウントID" },
  { group: "LINE相談", path: "channels.line.accountName", label: "LINE公式アカウント名" },
  { group: "LINE相談", path: "channels.line.feeDisclosure", label: "LINE相談の料金表示" },
  { group: "LINE相談", path: "channels.line.acceptanceHours", label: "LINEの送信受付時間" },
  { group: "LINE相談", path: "channels.line.replyHours", label: "LINEの有人返信時間" },
  { group: "LINE相談", path: "channels.line.formerChildcareWorkerProcess", label: "LINEの元保育士担当体制" },
  { group: "電話相談", path: "channels.phone.requestViaLine", label: "電話相談のLINE受付要否", type: "boolean" },
  { group: "電話相談", path: "channels.phone.consultationFeeDisclosure", label: "電話相談料の表示" },
  { group: "電話相談", path: "channels.phone.callChargeDisclosure", label: "通話料の表示" },
  { group: "電話相談", path: "channels.phone.hours", label: "電話の受付時間" },
  { group: "電話相談", path: "channels.phone.reservationRequired", label: "電話の予約要否", type: "boolean" },
  { group: "電話相談", path: "channels.phone.formerChildcareWorkerProcess", label: "電話の元保育士担当体制" },
  { group: "サービス", path: "service.audience", label: "対象者" },
  { group: "サービス", path: "service.staffing", label: "相談担当体制" },
  { group: "サービス", path: "service.membershipConditions", label: "組合加入の条件" },
  { group: "サービス", path: "service.cancellationRefundPolicy", label: "取消・返金の条件" },
  { group: "サービス", path: "service.contactPolicy", label: "勤務先への連絡方針" },
  { group: "サービス", path: "service.acceptsUndecided", label: "退職未決定の相談受付", type: "boolean" },
  { group: "サービス", path: "service.consultationRelationNote", label: "相談料と支援料の関係" },
  { group: "対応範囲", path: "service.scope.consultation", label: "相談できること", type: "array" },
  { group: "対応範囲", path: "service.scope.unionSupport", label: "組合が担当する支援", type: "array" },
  { group: "対応範囲", path: "service.scope.individualReview", label: "個別確認が必要な事項", type: "array" },
  { group: "対応範囲", path: "service.scope.outOfScope", label: "対象外の業務", type: "array" },
  { group: "料金", path: "pricing.taxStatus", label: "税区分", type: "tax" },
  { group: "料金", path: "pricing.taxNote", label: "税区分の注記" },
  { group: "料金", path: "pricing.paymentMethods", label: "支払い方法" },
  { group: "料金", path: "pricing.paymentTiming", label: "支払い時点" },
  { group: "料金", path: "pricing.total.note", label: "総額の注記" },
  { group: "法務", path: "legal.privacyEffectiveDate", label: "プライバシーポリシー施行日", type: "date" },
  { group: "法務", path: "legal.termsEffectiveDate", label: "利用条件施行日", type: "date" },
  { group: "法務", path: "legal.privacyContact", label: "個人情報に関する問い合わせ先" },
  { group: "法務", path: "legal.retentionPeriod", label: "相談情報の保存期間" },
  { group: "法務", path: "legal.aiProvider", label: "AI外部サービスの提供事業者" },
  { group: "法務", path: "legal.lineProvider", label: "LINE外部サービスの提供事業者" },
  { group: "法務", path: "legal.hostingProvider", label: "ホスティング事業者" },
  { group: "法務", path: "legal.deletionMethod", label: "保存情報の削除方法" },
];

const REQUIRED_TRUE = [
  { group: "AIチャット", path: "channels.ai.verified", label: "AIチャット接続の確認" },
  { group: "LINE相談", path: "channels.line.verified", label: "LINE公式アカウントの確認" },
  { group: "電話相談", path: "channels.phone.verified", label: "LINE経由の電話相談フロー確認" },
  { group: "サービス", path: "service.contactPolicyApproved", label: "勤務先への連絡方針の承認" },
  { group: "対応範囲", path: "service.scope.verified", label: "対応範囲の承認" },
  { group: "料金", path: "pricing.total.verified", label: "総額の確認" },
  { group: "公開承認", path: "publication.businessApproved", label: "事業面の公開承認" },
  { group: "公開承認", path: "publication.privacyApproved", label: "個人情報面の公開承認" },
  { group: "公開承認", path: "publication.contentApproved", label: "コンテンツの公開承認" },
  { group: "公開承認", path: "publication.technicalVerified", label: "技術検証の完了" },
];

const VALID_TAX = new Set(["included", "excluded", "mixed"]);

function issue(group, path, label, reason) {
  return { group, path, label, reason };
}

function looksLikePlaceholder(value) {
  if (typeof value !== "string") return false;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !looksLikePlaceholder(value);
  } catch {
    return false;
  }
}

function isValidPhone(value) {
  if (typeof value !== "string") return false;
  const normalized = value.replace(/[^\d+]/g, "");
  if (!/^\+?\d{10,15}$/.test(normalized)) return false;
  return !PLACEHOLDER_PHONE_PATTERNS.some((pattern) => pattern.test(value));
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

function checkType(field, value) {
  switch (field.type) {
    case "url":
      return isValidUrl(value) ? null : "https の実在URLを設定してください（example.com・テストURLは不可）";
    case "origin": {
      if (!isValidUrl(value)) return "https の公開ドメインを設定してください";
      const url = new URL(value);
      if (url.pathname !== "/" || url.search || url.hash) return "パス・クエリを含まないオリジンだけを設定してください";
      return null;
    }
    case "phone":
      return isValidPhone(value) ? null : "実在する電話番号をハイフン区切りで設定してください（テスト番号は不可）";
    case "date":
      return isValidDate(value) ? null : "YYYY-MM-DD 形式の実在日を設定してください";
    case "boolean":
      return typeof value === "boolean" ? null : "true / false を設定してください";
    case "array":
      return Array.isArray(value) && value.length > 0 ? null : "1件以上の内容を設定してください";
    case "tax":
      return VALID_TAX.has(value) ? null : "included / excluded / mixed のいずれかを設定してください";
    default:
      return null;
  }
}

export function collectIssues(config) {
  const missing = [];
  const invalid = [];
  const warnings = [];

  for (const field of REQUIRED_FIELDS) {
    const value = getByPath(config, field.path);
    if (!isFilled(value)) {
      missing.push(issue(field.group, field.path, field.label, "未設定"));
      continue;
    }
    const typeError = checkType(field, value);
    if (typeError) invalid.push(issue(field.group, field.path, field.label, typeError));
    if (typeof value === "string" && looksLikePlaceholder(value) && field.type !== "url" && field.type !== "origin" && field.type !== "phone") {
      invalid.push(issue(field.group, field.path, field.label, "プレースホルダー文字列が残っています"));
    }
  }

  for (const field of REQUIRED_TRUE) {
    if (getByPath(config, field.path) !== true) {
      missing.push(issue(field.group, field.path, field.label, "承認・確認が true ではありません"));
    }
  }

  if (config.operator?.type !== "labor_union") {
    invalid.push(issue("運営者", "operator.type", "運営主体", "labor_union を設定してください"));
  }

  if (config.operator?.contactUrl && !isValidUrl(config.operator.contactUrl)) {
    invalid.push(issue("運営者", "operator.contactUrl", "問い合わせURL", "https の実在URLを設定してください"));
  }

  const phone = config.channels?.phone ?? {};
  if (phone.requestViaLine === true) {
    if (!isFilled(phone.requestUrl)) {
      missing.push(issue("電話相談", "channels.phone.requestUrl", "電話相談希望を送るLINE URL", "未設定"));
    } else if (!isValidUrl(phone.requestUrl)) {
      invalid.push(issue("電話相談", "channels.phone.requestUrl", "電話相談希望を送るLINE URL", "https の実在URLを設定してください"));
    }
  } else if (phone.requestViaLine === false) {
    if (!isFilled(phone.number)) {
      missing.push(issue("電話相談", "channels.phone.number", "電話番号", "未設定"));
    } else if (!isValidPhone(phone.number)) {
      invalid.push(issue("電話相談", "channels.phone.number", "電話番号", "実在する電話番号を設定してください（テスト番号は不可）"));
    }
  }

  const items = Array.isArray(config.pricing?.items) ? config.pricing.items : [];
  if (items.length === 0) {
    missing.push(issue("料金", "pricing.items", "料金項目", "料金項目がありません"));
  }

  const ids = new Set();
  const totalIncludesAllSupportCosts =
    config.pricing?.total?.verified === true &&
    config.pricing?.total?.includesAllSupportCosts === true &&
    typeof config.pricing?.total?.fixedAmount === "number";
  for (const item of items) {
    if (!isFilled(item.id) || !isFilled(item.label) || !isFilled(item.group)) {
      invalid.push(issue("料金", `pricing.items[${item.id || "?"}]`, "料金項目", "id・label・group を設定してください"));
    }
    if (ids.has(item.id)) {
      invalid.push(issue("料金", `pricing.items.${item.id}`, item.label || item.id, "id が重複しています"));
    }
    ids.add(item.id);
    const amountIncludedInTotal =
      totalIncludesAllSupportCosts &&
      ["support-fee", "union-enrollment", "union-monthly"].includes(item.id);
    if (!amountIncludedInTotal) {
      if (typeof item.amount !== "number" || !Number.isFinite(item.amount) || item.amount < 0) {
        missing.push(issue("料金", `pricing.items.${item.id}.amount`, item.label || item.id, "金額が未設定です"));
      }
      if (item.verified !== true) {
        missing.push(issue("料金", `pricing.items.${item.id}.verified`, item.label || item.id, "料金の確認が true ではありません"));
      }
    }
    if (typeof item.amount === "number" && item.amount > 10000000) {
      warnings.push(issue("料金", `pricing.items.${item.id}.amount`, item.label || item.id, "金額が1,000万円を超えています。入力ミスを確認してください"));
    }
    if (typeof item.note === "string" && looksLikePlaceholder(item.note)) {
      invalid.push(issue("料金", `pricing.items.${item.id}.note`, item.label || item.id, "注記にプレースホルダーが残っています"));
    }
  }

  const componentIds = Array.isArray(config.pricing?.total?.componentIds) ? config.pricing.total.componentIds : [];
  if (componentIds.length === 0) {
    missing.push(issue("料金", "pricing.total.componentIds", "総額の構成", "総額に含める項目がありません"));
  }
  for (const id of componentIds) {
    if (!ids.has(id)) {
      invalid.push(issue("料金", "pricing.total.componentIds", "総額の構成", `${id} が料金項目に存在しません`));
    }
  }
  const fixedAmount = config.pricing?.total?.fixedAmount;
  if (fixedAmount !== undefined && fixedAmount !== null) {
    if (typeof fixedAmount !== "number" || !Number.isFinite(fixedAmount) || fixedAmount < 0) {
      invalid.push(issue("料金", "pricing.total.fixedAmount", "固定の総額", "0以上の数値を設定してください"));
    } else {
      const components = componentIds.map((id) => items.find((item) => item.id === id)).filter(Boolean);
      const componentsVerified =
        components.length === componentIds.length &&
        components.every((item) => item.verified === true && typeof item.amount === "number");
      if (componentsVerified && components.reduce((sum, item) => sum + item.amount, 0) !== fixedAmount) {
        invalid.push(issue("料金", "pricing.total.fixedAmount", "固定の総額", "確認済みの内訳合計と一致しません"));
      }
    }
  }

  const staff = Array.isArray(config.staff) ? config.staff : [];
  if (staff.length === 0) {
    missing.push(issue("相談員", "staff", "元保育士スタッフのプロフィール", "公開承認済みのプロフィールがありません"));
  } else {
    const covered = new Set();
    staff.forEach((person, index) => {
      const path = `staff[${index}]`;
      if (person.approved !== true) {
        missing.push(issue("相談員", `${path}.approved`, person.name || `スタッフ${index + 1}`, "公開承認が true ではありません"));
      }
      for (const key of ["name", "role", "experience", "message", "updatedAt"]) {
        if (!isFilled(person[key])) {
          missing.push(issue("相談員", `${path}.${key}`, person.name || `スタッフ${index + 1}`, "プロフィール項目が未設定です"));
        }
      }
      if (!isFilled(person.updatedAt) || !isValidDate(person.updatedAt)) {
        invalid.push(issue("相談員", `${path}.updatedAt`, person.name || `スタッフ${index + 1}`, "更新日は YYYY-MM-DD で設定してください"));
      }
      if (!Array.isArray(person.channels) || person.channels.length === 0) {
        missing.push(issue("相談員", `${path}.channels`, person.name || `スタッフ${index + 1}`, "担当窓口が未設定です"));
      } else {
        person.channels.forEach((channel) => covered.add(channel));
      }
      if (typeof person.name === "string" && looksLikePlaceholder(person.name)) {
        invalid.push(issue("相談員", `${path}.name`, person.name, "仮の氏名が残っています"));
      }
    });
    for (const channel of ["line", "phone"]) {
      if (!covered.has(channel)) {
        missing.push(issue("相談員", "staff", "相談員の担当窓口", `${channel} を担当する承認済みスタッフがいません`));
      }
    }
  }

  if (config.analytics?.enabled === true) {
    if (config.analytics.privacyApproved !== true) {
      missing.push(issue("計測", "analytics.privacyApproved", "解析のプライバシー承認", "解析を有効にする前に承認が必要です"));
    }
    if (!isFilled(config.analytics.provider)) {
      missing.push(issue("計測", "analytics.provider", "解析事業者", "解析事業者が未設定です"));
    }
    if (!isFilled(config.legal?.analyticsProvider)) {
      missing.push(issue("計測", "legal.analyticsProvider", "解析事業者（開示）", "解析を有効にする場合は開示用の事業者名も必要です"));
    }
  } else {
    warnings.push(issue("計測", "analytics.enabled", "アクセス解析", "初期状態では無効です。有効化にはプライバシー承認が必要です"));
  }

  const claims = config.claims && typeof config.claims === "object" ? config.claims : {};
  for (const [key, value] of Object.entries(claims)) {
    if (value === true) {
      invalid.push(issue("主張", `claims.${key}`, key, "未確認の主張です。根拠・承認・表示文言を追加するまで true にできません"));
    }
  }

  if (Array.isArray(config.guides) && config.guides.length === 0) {
    warnings.push(issue("解説記事", "guides", "解説記事", "未収載です（初回公開の必須範囲外・空のカテゴリは作りません）"));
  }

  if (!isFilled(config.legal?.analyticsProvider) && config.analytics?.enabled !== true) {
    warnings.push(issue("法務", "legal.analyticsProvider", "解析事業者", "解析無効のため未設定です"));
  }

  if (config.contentUpdatedAt && isValidDate(config.contentUpdatedAt)) {
    const today = new Date();
    const todayIso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString().slice(0, 10);
    if (config.contentUpdatedAt > todayIso) {
      invalid.push(issue("公開設定", "contentUpdatedAt", "コンテンツ更新日", "未来の日付です"));
    }
  }

  const origin = normalizeOrigin(config.canonicalOrigin);
  if (origin && looksLikePlaceholder(origin)) {
    invalid.push(issue("公開設定", "canonicalOrigin", "公開ドメイン", "プレースホルダーのドメインです"));
  }

  return { missing, invalid, warnings, blockers: [...missing, ...invalid] };
}

export function productionReady(config) {
  const { blockers } = collectIssues(config);
  return blockers.length === 0;
}

export function scanProductionText(text) {
  const hits = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) hits.push(String(pattern));
  }
  if (/0{3,}-\d/.test(text) || /0120-?000/.test(text) || /03-?0000/.test(text) || /090-?0000/.test(text)) {
    hits.push("テスト電話番号");
  }
  return [...new Set(hits)];
}
