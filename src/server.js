import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "state.json");
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const ASSETS_DIR = path.join(__dirname, "..", "storage", "assets");
const FRONTEND_PROXY_ORIGIN = process.env.FRONTEND_PROXY_ORIGIN || "";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const JWT_SECRET = process.env.JWT_SECRET || "change-me-dev";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin-token";
const ADMIN_TOKEN_HEADER = "x-admin-token";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_ENDPOINT = process.env.OPENAI_IMAGE_ENDPOINT || "https://api.openai.com/v1/images/generations";
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
const OPENAI_VISION_ENDPOINT = process.env.OPENAI_VISION_ENDPOINT || "https://api.openai.com/v1/chat/completions";
const DEFAULT_QUOTA = Number(process.env.DEFAULT_QUOTA || 5);
const MAX_JSON_BODY_BYTES = Number(process.env.MAX_JSON_BODY_BYTES || 6_000_000);
const MAX_INFERENCE_IMAGE_BYTES = Number(process.env.MAX_INFERENCE_IMAGE_BYTES || 2_500_000);
const MAX_PROMPT_IMPORT_ITEMS = Number(process.env.MAX_PROMPT_IMPORT_ITEMS || 300);
const MAX_PROMPT_LENGTH = Number(process.env.MAX_PROMPT_LENGTH || 2000);
const IDEMPOTENCY_WINDOW_MS = Number(process.env.IDEMPOTENCY_WINDOW_MS || 90_000);
const ADMIN_RATE_WINDOW_MS = Number(process.env.ADMIN_RATE_WINDOW_MS || 60_000);
const ADMIN_RATE_MAX = Number(process.env.ADMIN_RATE_MAX || 30);

const RATIO_MAP = {
  "1:1": "1024x1024",
  "4:5": "1024x1280",
  "16:9": "1792x1024",
  "9:16": "1024x1792",
};

const ALLOWED_TYPES = ["poster", "product_shot", "social_post", "banner", "cover"];
const ALLOWED_INDUSTRIES = ["ecommerce", "food", "education", "fitness", "travel", "finance", "beauty", "tech"];
const ALLOWED_SIZES = Object.keys(RATIO_MAP);
const DEFAULT_CONFIDENCE = 0.55;

const TYPE_RULES = {
  poster: ["poster", "宣传海报", "活动海报", "campaign", "launch", "promo", "advertisement", "publicity", "slogan"],
  product_shot: ["product_shot", "产品图", "电商图", "白底", "主图", "sku", "listing", "商品图", "细节图", "catalog", "ecom", "电商"],
  social_post: ["social_post", "社媒", "社交媒体", "朋友圈", "小红书", "instagram", "meta", "story", "feed", "动态", "短视频", "视频号", "社交"],
  banner: ["banner", "横幅", "活动页", "topbar", "首页横幅", "header", "hero", "intro banner", "leaderboard"],
  cover: ["cover", "封面图", "封面", "封面照", "封面海报", "封面照", "标题图", "封面banner"],
};

const INDUSTRY_RULES = {
  ecommerce: ["ecommerce", "电商", "淘宝", "天猫", "拼多多", "店铺", "商品", "sku", "买家", "listing", "下单", "交易", "促销"],
  food: ["food", "餐饮", "美食", "菜品", "甜品", "咖啡", "奶茶", "甜点", "外卖", "酒饮", "食物", "餐厅", "料理"],
  education: ["education", "教育", "课程", "培训", "讲师", "学习", "学习营", "学校", "考研", "就业课", "知识付费", "招生"],
  fitness: ["fitness", "健身", "减脂", "增肌", "运动", "训练", "课程", "肌肉", "拉伸", "瑜伽", "跑步", "健身房", "体型", "健康"],
  travel: ["travel", "旅行", "旅游", "酒店", "目的地", "出行", "机票", "景区", "线路", "度假", "city"],
  finance: ["finance", "金融", "理财", "投资", "保险", "信贷", "基金", "证券", "贷款", "银行", "财富", "币圈"],
  beauty: ["beauty", "美妆", "护肤", "彩妆", "香氛", "精油", "皮肤", "抗老", "口红", "妆容", "护肤品"],
  tech: ["tech", "科技", "SaaS", "软件", "App", "工具", "AI", "人工智能", "平台", "研发", "程序", "app", "互联网", "硬件"],
};

const FILE_MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
};

const DEFAULT_STATE = {
  users: [],
  inviteCodes: [],
  promptLibrary: [],
  templates: [
    {
      id: "tpl_poster_default",
      type: "poster",
      industry: "*",
      basePrompt:
        "professional marketing poster, premium composition, bold focal point, balanced spacing for title and CTA, high contrast, no watermark",
      negativePrompt: "low quality, blurry, warped text, watermark, logo clutter, bad typography, cut-off subjects",
      allowedSizes: ["1:1", "4:5", "16:9"],
      industryPrompt: "clean commercial marketing style"
    },
    {
      id: "tpl_product_shot_default",
      type: "product_shot",
      industry: "*",
      basePrompt:
        "clean e-commerce product shot, centered product, natural lighting, neutral background, crisp edges, realistic product materials",
      negativePrompt: "multiple products, cluttered background, busy props, tiny product, distorted shape, watermark",
      allowedSizes: ["1:1", "4:5"],
      industryPrompt: "product-first composition with realistic texture"
    },
    {
      id: "tpl_social_default",
      type: "social_post",
      industry: "*",
      basePrompt:
        "social media marketing visual, eye-catching layout, mobile-first hierarchy, readable text space, vibrant but balanced color",
      negativePrompt: "text unreadable, cluttered elements, low contrast, watermark, cropped text",
      allowedSizes: ["1:1", "9:16", "4:5"],
      industryPrompt: "social platform creative style"
    },
    {
      id: "tpl_banner_default",
      type: "banner",
      industry: "*",
      basePrompt:
        "web banner visual, strong left-to-right composition, clear headline area, high readability for title and badge",
      negativePrompt: "tiny key elements, watermark, text overlap, side crop, noisy background",
      allowedSizes: ["16:9", "1:1"],
      industryPrompt: "horizontal campaign visual style"
    },
    {
      id: "tpl_cover_default",
      type: "cover",
      industry: "*",
      basePrompt:
        "cover poster composition, elegant framed focus, premium minimal look, large title zone, soft depth of field",
      negativePrompt: "overly complex, cluttered composition, unreadable title area, watermark",
      allowedSizes: ["16:9", "4:5"],
      industryPrompt: "hero style cover"
    },
    {
      id: "tpl_food_poster",
      type: "poster",
      industry: "food",
      basePrompt:
        "food campaign poster style, appetizing presentation, natural lighting, warm atmosphere",
      negativePrompt: "dark lighting, unappetizing colors, text unreadable, watermark",
      allowedSizes: ["1:1", "4:5", "16:9"],
      industryPrompt: "fresh and tasty food aesthetic"
    },
    {
      id: "tpl_ecommerce_product_shot",
      type: "product_shot",
      industry: "ecommerce",
      basePrompt:
        "strict e-commerce catalog image, crisp white background, studio lighting, neutral shadows, centered product",
      negativePrompt: "pattern shadows, wrong ratio, distorted object, text overlay, watermark",
      allowedSizes: ["1:1", "4:5"],
      industryPrompt: "conversion-oriented e-commerce listing style"
    },
    {
      id: "tpl_beauty_social",
      type: "social_post",
      industry: "beauty",
      basePrompt:
        "beauty brand social ad, soft clean tones, premium skincare aesthetic, smooth gradients",
      negativePrompt: "harsh shadow, heavy noise, low contrast, watermark",
      allowedSizes: ["1:1", "9:16", "4:5"],
      industryPrompt: "cosmetic-inspired premium beauty style"
    }
  ],
  jobs: [],
  assets: [],
  customOverrides: [],
  logs: []
};

class Store {
  constructor(filePath) {
    this.filePath = filePath;
    this.state = null;
  }

  async init() {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw);
      if (!this.state || typeof this.state !== "object") {
        throw new Error("Invalid state");
      }
      if (!this.state.templates?.length) {
        this.state.templates = DEFAULT_STATE.templates;
      }
      if (!Array.isArray(this.state.users)) this.state.users = [];
      if (!Array.isArray(this.state.jobs)) this.state.jobs = [];
      if (!Array.isArray(this.state.assets)) this.state.assets = [];
      if (!Array.isArray(this.state.promptLibrary)) this.state.promptLibrary = [];
      if (!Array.isArray(this.state.logs)) this.state.logs = [];
    } catch (e) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      await this.save();
    }
  }

  async save() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  getAll() {
    return this.state;
  }

  withMutations(mutator) {
    mutator(this.state);
  }
}

const store = new Store(DATA_FILE);
const activeGenerationJobs = new Set();
const adminAccessWindow = new Map();

function genId(prefix = "id") {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function safeText(value) {
  return String(value || "").trim().slice(0, 3000);
}

function normalizeText(value) {
  return safeText(value).toLowerCase();
}

function classifyText(value, rules, allowed) {
  const normalized = normalizeText(value);
  const scores = {};
  Object.entries(rules).forEach(([label, ruleset]) => {
    let score = 0;
    ruleset.forEach((keyword) => {
      const key = String(keyword).toLowerCase();
      if (key && normalized.includes(key)) {
        score += 1;
      }
    });
    if (score > 0) scores[label] = score;
  });
  if (Object.keys(scores).length === 0) return null;
  const list = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = list[0];
  if (!top) return null;
  const [typeValue, typeScore] = top;
  const total = Object.values(scores).reduce((sum, item) => sum + item, 0);
  const conf = typeScore / total;
  return {
    value: typeValue,
    score: conf,
    all: list.map(([k, s]) => ({ value: k, score: total ? s / total : 0 })),
    matched: list.filter(([, s]) => s > 0).map(([k]) => k),
  };
}

function classifyPrompt(payload) {
  const prompt = safeText(payload.prompt);
  const preferredType = safeText(payload.type);
  const preferredIndustry = safeText(payload.industry);
  const manualTypeOk = ALLOWED_TYPES.includes(preferredType);
  const manualIndustryOk = ALLOWED_INDUSTRIES.includes(preferredIndustry);

  const typePrediction = manualTypeOk ? { value: preferredType, score: 1, method: "manual" } : classifyText(prompt, TYPE_RULES);
  const industryPrediction = manualIndustryOk ? { value: preferredIndustry, score: 1, method: "manual" } : classifyText(prompt, INDUSTRY_RULES);

  const finalType = (typePrediction && typePrediction.value) || "poster";
  const finalIndustry = (industryPrediction && industryPrediction.value) || "tech";

  return {
    type: {
      predicted: finalType,
      confidence: typePrediction?.score || 0,
      method: typePrediction?.method || "keyword",
      topMatches: typePrediction?.all || [],
      matched: typePrediction?.matched || [],
    },
    industry: {
      predicted: finalIndustry,
      confidence: industryPrediction?.score || 0,
      method: industryPrediction?.method || "keyword",
      topMatches: industryPrediction?.all || [],
      matched: industryPrediction?.matched || [],
    },
    normalizedLength: prompt.length,
  };
}

function classifyAndNormalizePromptItem(item, index) {
  const raw = typeof item === "string" ? safeText(item) : safeText(item.prompt || item.text || item.content || "");
  const name = safeText(item.name || item.title || raw.slice(0, 26) || `prompt-${index + 1}`);
  const preferredType = safeText(item.type || item.outputType || item.category);
  const preferredIndustry = safeText(item.industry || item.outputIndustry);
  const classification = classifyPrompt({ prompt: raw, type: preferredType, industry: preferredIndustry });
  return {
    name,
    prompt: raw,
    preferredType: manualize(preferredType),
    preferredIndustry: manualize(preferredIndustry),
    classification,
  };
}

function manualize(value) {
  if (!value) return "";
  if (ALLOWED_TYPES.includes(value) || ALLOWED_INDUSTRIES.includes(value)) return value;
  return "";
}

function buildPromptLibraryRecord(item) {
  const base = classifyAndNormalizePromptItem(item, 0);
  const typePred = base.classification.type;
  const indPred = base.classification.industry;
  return {
    id: genId("prompt"),
    name: base.name,
    prompt: base.prompt,
    createdAt: nowIso(),
    predicted: {
      type: typePred.predicted,
      typeConfidence: Number(Math.min(1, Math.max(0, typePred.confidence || 0)).toFixed(3)),
      industry: indPred.predicted,
      industryConfidence: Number(Math.min(1, Math.max(0, indPred.confidence || 0)).toFixed(3)),
      typeMethod: typePred.method,
      industryMethod: indPred.method,
    },
    tags: Array.from(new Set([...(typePred.matched || []), ...(indPred.matched || [])])),
    custom: {},
  };
}

function isAllowedTypeForUser(user, type) {
  if (!user || !Array.isArray(user.allowedTypes) || user.allowedTypes.length === 0) {
    return true;
  }
  return user.allowedTypes.includes(type);
}

function parseGeneratePayload(body) {
  const type = safeText(body.type);
  const industry = safeText(body.industry);
  const title = safeText(body.title);
  const subtitle = safeText(body.subtitle);
  const ratio = safeText(body.ratio || "1:1");
  const count = Math.min(4, Math.max(1, Number(body.count || 3)));
  const cta = safeText(body.cta);
  const colorStyle = safeText(body.colorStyle);
  const brandTone = safeText(body.brandTone);
  const customPrompt = safeText(body.customPrompt);

  if (!ALLOWED_TYPES.includes(type)) {
    return { ok: false, error: "Unsupported type." };
  }
  if (!ALLOWED_INDUSTRIES.includes(industry)) {
    return { ok: false, error: "Unsupported industry." };
  }
  if (!ALLOWED_SIZES.includes(ratio)) {
    return { ok: false, error: "Unsupported ratio." };
  }

  const parsed = {
    ok: true,
    type,
    industry,
    title,
    subtitle,
    ratio,
    count,
    cta,
    colorStyle,
    brandTone,
    customPrompt,
  };
  if (Number.isNaN(parsed.count)) {
    return { ok: false, error: "Invalid count." };
  }
  return parsed;
}

function toBase64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function b64JsonDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signToken(payload) {
  const body = toBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  const payload = b64JsonDecode(body);
  if (!payload || payload.exp < Date.now()) return null;
  return payload;
}

function getTokenPayload(req) {
  const auth = req.headers["authorization"] || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7);
  return verifyToken(token);
}

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function sendText(res, statusCode, body, type = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function getRequestIp(req) {
  const xff = req.headers["x-forwarded-for"];
  const first = Array.isArray(xff) ? xff[0] : String(xff || "").split(",")[0];
  return (first || req.socket?.remoteAddress || "unknown").trim();
}

async function parseBody(req) {
  return new Promise((resolve) => {
    const contentLength = Number(req.headers["content-length"]);
    if (!Number.isNaN(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
      resolve({ ok: false, status: 413, error: "Request body too large." });
      return;
    }
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_JSON_BODY_BYTES) {
        req.destroy();
        resolve({ ok: false, status: 413, error: "Request body too large." });
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks);
      if (!raw.length) return resolve({ ok: true, body: {} });
      try {
        resolve({ ok: true, body: JSON.parse(raw.toString("utf8")) });
      } catch {
        resolve({ ok: false, status: 400, error: "Invalid JSON body." });
      }
    });
    req.on("error", () => resolve({ ok: false, status: 400, error: "Invalid request body." }));
  });
}

function requireBodyJson(req, res) {
  return parseBody(req).then((result) => {
    if (!result || result.ok === false) {
      sendJson(res, result?.status || 400, { ok: false, error: result?.error || "Invalid JSON body." });
      return null;
    }
    return result.body;
  });
}

function normalizeAdminToken(value) {
  return String(value || "").trim();
}

function isAdminRateLimited(ip) {
  const now = Date.now();
  const bucket = adminAccessWindow.get(ip) || [];
  const active = bucket.filter((ts) => now - ts < ADMIN_RATE_WINDOW_MS);
  if (active.length >= ADMIN_RATE_MAX) {
    adminAccessWindow.set(ip, active);
    return true;
  }
  active.push(now);
  adminAccessWindow.set(ip, active);
  return false;
}

function recordAdminLog(state, req, payload) {
  state.logs = state.logs || [];
  state.logs.push({
    id: genId("adminlog"),
    path: req.url,
    ip: getRequestIp(req),
    userAgent: req.headers["user-agent"] || "",
    ...payload,
    createdAt: nowIso(),
  });
  if (state.logs.length > 5000) {
    state.logs = state.logs.slice(-5000);
  }
}

function requireAdminAuth(req, res) {
  const headerToken = req.headers[ADMIN_TOKEN_HEADER] || "";
  const authHeader = req.headers["authorization"] || "";
  const token = normalizeAdminToken(authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : headerToken);
  const expect = normalizeAdminToken(ADMIN_TOKEN);
  const mismatch =
    !token ||
    token.length !== expect.length ||
    !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expect));

  if (mismatch) {
    const state = store.getAll();
    recordAdminLog(state, req, { ok: false, action: req.method, reason: "invalid_token" });
    store.save().catch(() => {});
    sendJson(res, 401, { ok: false, error: "Bad admin token." });
    return false;
  }

  if (expect === "admin-token") {
    const state = store.getAll();
    recordAdminLog(state, req, { ok: false, action: req.method, reason: "insecure_default_token" });
    store.save().catch(() => {});
    sendJson(res, 403, { ok: false, error: "Please set ADMIN_TOKEN in environment." });
    return false;
  }

  if (isAdminRateLimited(getRequestIp(req))) {
    const state = store.getAll();
    recordAdminLog(state, req, { ok: false, action: req.method, reason: "rate_limited" });
    store.save().catch(() => {});
    sendJson(res, 429, { ok: false, error: "Too many admin requests." });
    return false;
  }

  return true;
}

function buildPromptLibrarySignature({ prompt, type, industry, name }) {
  return crypto
    .createHash("sha256")
    .update(`${safeText(prompt).toLowerCase()}\n${type}\n${industry}\n${safeText(name).toLowerCase()}`)
    .digest("hex");
}

function buildRequestFingerprint(userId, payload, source) {
  return crypto
    .createHash("sha256")
    .update(`${userId}|${source}|${payload.type}|${payload.industry}|${payload.ratio}|${payload.count}|${payload.title}|${payload.subtitle}|${payload.cta}|${payload.colorStyle}|${payload.brandTone}|${payload.customPrompt}`)
    .digest("hex");
}

function findActiveJobByFingerprint(state, userId, fingerprint) {
  const deadline = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString();
  return state.jobs.find(
    (job) =>
      job.userId === userId &&
      job.requestFingerprint === fingerprint &&
      job.createdAt >= deadline &&
      (job.status === "queued" || job.status === "processing")
  );
}

function applyCorsPreflight(req, res) {
  if (req.method !== "OPTIONS") return false;
  if (!req.url.startsWith("/api")) return false;
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end();
  return true;
}

function getUserByToken(req) {
  const payload = getTokenPayload(req);
  if (!payload) return null;
  const user = store.getAll().users.find((u) => u.id === payload.uid);
  return user || null;
}

function assertAuth(req, res) {
  const user = getUserByToken(req);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "Unauthorized. Please login." });
    return null;
  }
  return user;
}

function getTemplates({ type, industry }) {
  const items = store.getAll().templates || [];
  const specific = items.filter((t) => t.type === type && (t.industry === industry || t.industry === "*"));
  if (specific.length > 0) return specific.sort((a, b) => (a.industry === industry ? -1 : 1));
  const wildcard = items.filter((t) => t.type === type && t.industry === "*");
  if (wildcard.length > 0) return wildcard;
  return items.filter((t) => t.type === "poster" && t.industry === "*");
}

function buildPrompt(data) {
  const template = data.template;
  const ratio = data.ratio || "1:1";
  const type = data.type;
  const industry = data.industry;
  const title = safeText(data.title);
  const subtitle = safeText(data.subtitle);
  const cta = safeText(data.cta);
  const colorStyle = safeText(data.colorStyle);
  const brand = safeText(data.brandTone);
  const customPrompt = safeText(data.customPrompt);

  const chunks = [
    template.basePrompt,
    `Industry context: ${template.industryPrompt}.`,
    `Content type is ${type}.`,
    `Industry is ${industry}.`,
    `Canvas ratio is ${ratio}.`,
    `If text is shown, leave enough blank space for Chinese/English title and CTA.`,
    title ? `Main title: ${title}.` : "",
    subtitle ? `Subheadline: ${subtitle}.` : "",
    cta ? `Call to action: ${cta}.` : "",
    colorStyle ? `Color direction: ${colorStyle}.` : "",
    brand ? `Style mood: ${brand}.` : "",
    template.negativePrompt ? `Avoid: ${template.negativePrompt}.` : "",
    "No watermark, no random text, no logos unless user explicitly provides brand token.",
    customPrompt ? `Custom enhancement: ${customPrompt}.` : "",
  ];
  return chunks.filter(Boolean).join(" ");
}

function parseRatio(size) {
  return RATIO_MAP[size] || RATIO_MAP["1:1"];
}

function validateTemplateRatio(template, ratio) {
  const allowed = template?.allowedSizes || ALLOWED_SIZES;
  return allowed.includes(ratio);
}

function buildQueuedJob({ user, input, prompt, source, requestFingerprint = null, templateId = "", allowedSizes = [] }) {
  return {
    id: genId("job"),
    userId: user.id,
    type: input.type,
    industry: input.industry,
    ratio: input.ratio,
    inputPayload: {
      title: input.title,
      subtitle: input.subtitle,
      cta: input.cta,
      colorStyle: input.colorStyle,
      brandTone: input.brandTone,
      customPrompt: input.customPrompt,
      count: input.count,
    },
    finalPrompt: prompt,
    templateId,
    allowedSizes,
    status: "queued",
    source,
    model: IMAGE_MODEL,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    assets: [],
    requestFingerprint,
  };
}

function findInviteCode(codeValue) {
  const state = store.getAll();
  return state.inviteCodes.find((x) => x.code === codeValue);
}

function parseImageBase64Payload(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;

  const simple = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,(.+)$/;
  const matched = input.match(simple);
  if (matched) {
    return {
      mimeType: matched[1].toLowerCase(),
      base64: matched[2].replace(/\s+/g, ""),
    };
  }

  return {
    mimeType: "image/jpeg",
    base64: input.replace(/\s+/g, ""),
  };
}

function estimateImageByteLength(base64Data) {
  return Math.floor((String(base64Data || "").length * 3) / 4);
}

function parseVisionJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m?.[0]) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function mockImage(jobId, index, prompt, ratio) {
  const [w, h] = ratio.split("x").map(Number);
  const width = isNaN(w) ? 1024 : w;
  const height = isNaN(h) ? 1024 : h;
  const safeTitle = safeText(prompt).replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="none" stroke="#ffffff33" stroke-width="3"/>
    <text x="50%" y="45%" text-anchor="middle" dominant-baseline="middle" fill="#f8fafc" font-size="34" font-family="Arial, sans-serif">${safeTitle.slice(0, 90)}</text>
    <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="#cbd5e1" font-size="22" font-family="Arial, sans-serif">Mock image for ${jobId} #${index + 1}</text>
  </svg>`;
  return Buffer.from(svg, "utf8");
}

async function saveImageToStorage(buffer, fileName) {
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  const filePath = path.join(ASSETS_DIR, fileName);
  await fs.writeFile(filePath, buffer);
  return `/assets/${fileName}`;
}

function createAssetRecord(jobId, filePath, width, height, format) {
  return {
    id: genId("asset"),
    jobId,
    url: filePath,
    width,
    height,
    format,
    fileSize: 0,
    createdAt: nowIso(),
  };
}

async function fetchBinary(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

async function generateWithOpenAI(prompt, ratioPx) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
  const request = {
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: ratioPx,
  };
  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${text.slice(0, 1000)}`);
  }
  const data = await res.json();
  const item = data?.data?.[0];
  if (!item) throw new Error("Invalid OpenAI response");
  if (item.url) return fetchBinary(item.url);
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  throw new Error("OpenAI response missing image content");
}

async function inferPromptFromImage(imageBase64, imageMime = "image/jpeg") {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  if (!imageBase64 || !imageBase64.length) {
    throw new Error("imageBase64 is required.");
  }

  const visionInstruction = `你是专业的 prompt 工程师。请只输出 JSON，不要解释。输入是一张参考图片。
请返回内容：
{
  "inferredPrompt": "用于生成同风格的中文营销图提示词（可直接拼到现有模板后面）",
  "style": {
    "composition": "构图描述",
    "lighting": "光照描述",
    "colorTone": "色彩描述",
    "mood": "氛围描述",
    "aesthetics": "风格描述"
  },
  "negativeHints": ["可选的反向约束1", "可选2"]
}`;

  const prompt = `请先识别图片的整体风格、颜色、构图和文字区域，再给出能复用在同类营销图中的提示词。`;

  const payload = {
    model: OPENAI_VISION_MODEL,
    temperature: 0.2,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content: "你必须返回合法 JSON 对象，不要输出额外说明。",
      },
      {
        role: "user",
        content: [
          { type: "text", text: visionInstruction },
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } },
        ],
      },
    ],
  };

  const res = await fetch(OPENAI_VISION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vision model request failed: ${res.status} ${text.slice(0, 1200)}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  if (!raw) throw new Error("Vision model returned empty content.");
  const parsed = parseVisionJson(raw);

  if (parsed && typeof parsed === "object" && parsed.inferredPrompt) {
    return {
      inferredPrompt: safeText(parsed.inferredPrompt).slice(0, MAX_PROMPT_LENGTH),
      style: parsed.style || {},
      negativeHints: Array.isArray(parsed.negativeHints)
        ? parsed.negativeHints.map((item) => safeText(item)).slice(0, 8)
        : [],
    };
  }

  return { inferredPrompt: safeText(raw).slice(0, MAX_PROMPT_LENGTH), style: {}, negativeHints: [] };
}

async function createImageAsset(job, prompt, ratioPx, index) {
  const [w, h] = ratioPx.split("x").map(Number);
  let buffer = null;
  let ext = "svg";
  try {
    buffer = await generateWithOpenAI(prompt, ratioPx);
    ext = "png";
  } catch (err) {
    buffer = await mockImage(job.id, index, prompt, ratioPx);
    ext = "svg";
  }
  const fileName = `${job.id}_${index + 1}.${ext}`;
  const filePath = await saveImageToStorage(buffer, fileName);
  const asset = createAssetRecord(job.id, filePath, w, h, ext);
  asset.fileSize = buffer.length;
  return asset;
}

async function runGeneration(jobId, count, ratioPx) {
  if (activeGenerationJobs.has(jobId)) return;
  const state = store.getAll();
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job || job.status !== "queued") return;

  activeGenerationJobs.add(jobId);
  let finishedByAll = false;
  try {
    job.status = "processing";
    job.startedAt = nowIso();
    job.assets = [];
    await store.save();

    let successCount = 0;
    for (let i = 0; i < count; i++) {
      try {
        const asset = await createImageAsset(job, job.finalPrompt, ratioPx, i);
        state.assets.push(asset);
        successCount += 1;
        job.assets = job.assets || [];
        job.assets.push(asset.id);
        await store.save();
      } catch (err) {
        job.lastError = err.message;
        await store.save();
      }
    }

    if (successCount === 0) {
      job.status = "failed";
      job.error = "All image generations failed.";
    } else if (successCount === count) {
      job.status = "done";
      job.error = "";
      finishedByAll = true;
    } else {
      job.status = "partial";
      job.error = `Partial success (${successCount}/${count}).`;
    }
  } catch (err) {
    job.status = "failed";
    job.lastError = err.message;
    job.error = "Generation failed.";
  } finally {
    if (!finishedByAll && job.status === "processing") {
      job.status = job.error ? "failed" : "partial";
    }
    job.finishedAt = nowIso();
    job.updatedAt = nowIso();
    await store.save();
    activeGenerationJobs.delete(jobId);
  }
}

async function handleApi(req, res, pathname) {
  if (applyCorsPreflight(req, res)) return true;

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const body = await requireBodyJson(req, res);
    if (!body) return true;
    const identity = safeText(body.identity);
    if (!identity) {
      sendJson(res, 400, { ok: false, error: "identity is required." });
      return true;
    }

    const users = store.getAll().users;
    let user = users.find((u) => u.emailOrPhone === identity);
    if (!user) {
      user = {
        id: genId("user"),
        emailOrPhone: identity,
        planId: "free",
        quotaLeft: DEFAULT_QUOTA,
        inviterCodeId: null,
        allowedTypes: [],
        createdAt: nowIso(),
      };
      users.push(user);
    }

    const token = signToken({ uid: user.id, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    await store.save();
    sendJson(res, 200, { ok: true, token, user });
    return true;
  }

  if (pathname === "/api/templates" && req.method === "GET") {
    const state = store.getAll();
    const query = new URL(`http://localhost${pathname}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`);
    const type = query.searchParams.get("type") || "poster";
    const industry = query.searchParams.get("industry") || "*";
    const templates = getTemplates({ type, industry }).map((item) => ({
      id: item.id,
      type: item.type,
      industry: item.industry,
      industryPrompt: item.industryPrompt,
      allowedSizes: item.allowedSizes,
    }));
    sendJson(res, 200, { ok: true, templates });
    return true;
  }

  if (pathname === "/api/prompt-library" && req.method === "GET") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const query = new URL(`http://localhost${pathname}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`);
    const rawType = query.searchParams.get("type") || "";
    const rawIndustry = query.searchParams.get("industry") || "";
    const type = manualize(rawType);
    const industry = manualize(rawIndustry);
    const allItems = store.getAll().promptLibrary || [];
    const filterItems = allItems
      .filter((item) => {
        if (item.owner && item.owner !== user.id) return false;
        if (type && item.predicted?.type !== type) return false;
        if (industry && item.predicted?.industry !== industry) return false;
        return true;
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        prompt: item.prompt,
        predicted: item.predicted,
        tags: item.tags || [],
      }))
      .sort((a, b) => b.id.localeCompare(a.id));
    sendJson(res, 200, { ok: true, items: filterItems, total: filterItems.length });
    return true;
  }

  if (pathname === "/api/prompt-library/classify" && req.method === "POST") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const body = await requireBodyJson(req, res);
    if (!body) return true;
    const promptText = safeText(body.prompt || body.text || body.content);
    if (!promptText) {
      sendJson(res, 400, { ok: false, error: "prompt is required." });
      return true;
    }
    const type = safeText(body.type);
    const industry = safeText(body.industry);
    const classification = classifyPrompt({ prompt: promptText, type, industry });
    sendJson(res, 200, {
      ok: true,
      prompt: promptText,
      classify: {
        type: classification.type,
        industry: classification.industry,
        typeSuggestion: classification.type.predicted,
        industrySuggestion: classification.industry.predicted,
      },
    });
    return true;
  }

  if (pathname === "/api/reverse-prompt" && req.method === "POST") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const body = await requireBodyJson(req, res);
    if (!body) return true;
    const sourceImage = body.imageBase64 || body.image;
    const parsed = parseImageBase64Payload(sourceImage);
    if (!parsed || !parsed.base64) {
      sendJson(res, 400, { ok: false, error: "imageBase64 is required." });
      return true;
    }

    const byteLength = estimateImageByteLength(parsed.base64);
    if (!Number.isFinite(byteLength) || byteLength > MAX_INFERENCE_IMAGE_BYTES) {
      sendJson(res, 413, { ok: false, error: `Image too large. Max ${(MAX_INFERENCE_IMAGE_BYTES / 1024 / 1024).toFixed(1)}MB.` });
      return true;
    }

    try {
      const payload = await inferPromptFromImage(
        parsed.base64,
        parsed.mimeType || safeText(body.imageMime) || "image/jpeg",
      );
      sendJson(res, 200, {
        ok: true,
        inferredPrompt: payload.inferredPrompt,
        style: payload.style || {},
        negativeHints: payload.negativeHints || [],
        source: {
          userId: user.id,
          mimeType: parsed.mimeType || safeText(body.imageMime) || "image/jpeg",
        },
      });
    } catch (err) {
      sendJson(res, 500, {
        ok: false,
        error: err?.message || "Image style inference failed.",
      });
    }
    return true;
  }

  if (pathname === "/api/prompt-library/import" && req.method === "POST") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const body = await requireBodyJson(req, res);
    if (!body) return true;
    const prompts = Array.isArray(body.prompts) ? body.prompts : [];
    if (!prompts.length) {
      sendJson(res, 400, { ok: false, error: "No valid prompts provided." });
      return true;
    }
    if (prompts.length > MAX_PROMPT_IMPORT_ITEMS) {
      sendJson(res, 413, { ok: false, error: `Too many prompts. max is ${MAX_PROMPT_IMPORT_ITEMS}.` });
      return true;
    }
    const dryRun = body.dryRun === true;
    const normalizedInputs = [];
    const state = store.getAll();
    const existedSignatures = new Set(
      (state.promptLibrary || [])
        .filter((item) => item.owner === user.id)
        .map((item) => buildPromptLibrarySignature({ prompt: safeText(item.prompt), type: item?.predicted?.type, industry: item?.predicted?.industry, name: item?.name }))
    );
    const payloadSignatures = new Set();

    prompts.forEach((item, index) => {
      const raw = typeof item === "string" ? item : item?.prompt || item?.text || item?.content;
      const prompt = safeText(raw).slice(0, MAX_PROMPT_LENGTH);
      if (!prompt) return;
      const normalized = classifyAndNormalizePromptItem({ ...(item || {}), prompt }, index);
      const signature = buildPromptLibrarySignature({
        prompt: normalized.prompt,
        type: normalized.classification?.type?.predicted,
        industry: normalized.classification?.industry?.predicted,
        name: normalized.name,
      });
      if (existedSignatures.has(signature) || payloadSignatures.has(signature)) {
        return;
      }
      payloadSignatures.add(signature);
      normalizedInputs.push({
        ...normalized,
        rawInputIndex: index,
        signature,
      });
    });

    if (!normalizedInputs.length) {
      sendJson(res, 400, { ok: false, error: "No valid prompts provided." });
      return true;
    }

    if (!dryRun) {
      const records = normalizedInputs.map((item) => {
        const record = buildPromptLibraryRecord(item);
        record.owner = user.id;
        record.custom = {
          preferredType: item.preferredType || "",
          preferredIndustry: item.preferredIndustry || "",
          rawInputIndex: item.rawInputIndex || null,
          signature: item.signature || "",
        };
        return record;
      });
      store.withMutations((state) => {
        state.promptLibrary = state.promptLibrary || [];
        state.promptLibrary.push(...records);
      });
      await store.save();
      sendJson(res, 200, {
        ok: true,
        committed: true,
        imported: records.length,
        items: records.map((r) => ({ id: r.id, name: r.name, predicted: r.predicted, preview: r.prompt.slice(0, 80) })),
      });
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      dryRun: true,
      items: normalizedInputs.map((item) => ({
        name: item.name,
        prompt: item.prompt,
        preferredType: item.preferredType || "",
        preferredIndustry: item.preferredIndustry || "",
        classify: {
          type: item.classification.type,
          industry: item.classification.industry,
          suggestedType: item.classification.type.predicted,
          suggestedIndustry: item.classification.industry.predicted,
        },
      })),
      total: normalizedInputs.length,
      duplicates: Math.max(0, prompts.length - normalizedInputs.length),
      sample: normalizedInputs.slice(0, 3).map((item) => ({
        name: item.name,
        prompt: item.prompt.slice(0, 60),
      })),
    });
    return true;
  }

  if (pathname === "/api/invite/activate" && req.method === "POST") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const body = await requireBodyJson(req, res);
    if (!body) return true;
    const codeValue = safeText(body.code);
    if (!codeValue) {
      sendJson(res, 400, { ok: false, error: "code is required." });
      return true;
    }

    const code = findInviteCode(codeValue);
    if (!code) {
      sendJson(res, 404, { ok: false, error: "Code not found." });
      return true;
    }
    if (code.status !== "active") {
      sendJson(res, 400, { ok: false, error: "Code is not active." });
      return true;
    }
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      sendJson(res, 400, { ok: false, error: "Code is expired." });
      return true;
    }
    if ((code.quotaUsed || 0) >= (code.quotaTotal || 0)) {
      sendJson(res, 400, { ok: false, error: "Code quota exhausted." });
      return true;
    }
    const usedBy = code.usedBy || [];
    const thisUserUsed = usedBy.find((x) => x.userId === user.id);
    if ((code.maxUsesPerUser || 1) <= (thisUserUsed ? thisUserUsed.count : 0)) {
      sendJson(res, 400, { ok: false, error: "Your usage of this code has reached limit." });
      return true;
    }

    code.quotaUsed = (code.quotaUsed || 0) + 1;
    if (thisUserUsed) {
      thisUserUsed.count = (thisUserUsed.count || 0) + 1;
      thisUserUsed.usedAt = nowIso();
    } else {
      usedBy.push({ userId: user.id, count: 1, usedAt: nowIso() });
    }
    code.usedBy = usedBy;
    user.inviterCodeId = code.id;
    user.quotaLeft = (user.quotaLeft || 0) + (code.quotaGrant || 0);

    if (code.allowedTypes?.length) {
      user.allowedTypes = user.allowedTypes || [];
      user.allowedTypes = Array.from(new Set([...user.allowedTypes, ...code.allowedTypes]));
    }

    await store.save();
    sendJson(res, 200, {
      ok: true,
      quotaLeft: user.quotaLeft,
      code: {
        code: code.code,
        remains: (code.quotaTotal || 0) - (code.quotaUsed || 0),
      },
    });
    return true;
  }

  if (pathname === "/api/prompt-preview" && req.method === "POST") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const body = await requireBodyJson(req, res);
    if (!body) return true;

    const parsed = parseGeneratePayload(body);
    if (!parsed.ok) {
      sendJson(res, 400, { ok: false, error: parsed.error });
      return true;
    }
    if (!isAllowedTypeForUser(user, parsed.type)) {
      sendJson(res, 403, { ok: false, error: "Your invite code does not allow this type." });
      return true;
    }
    const templates = getTemplates({ type: parsed.type, industry: parsed.industry });
    const template = templates[0];
    if (!template) {
      sendJson(res, 500, { ok: false, error: "Template not available." });
      return true;
    }
    if (!validateTemplateRatio(template, parsed.ratio)) {
      sendJson(res, 400, {
        ok: false,
        error: `Ratio ${parsed.ratio} is not supported for ${parsed.type} (${template.allowedSizes.join(", ")}).`,
      });
      return true;
    }

    const finalPrompt = buildPrompt({
      template,
      type: parsed.type,
      industry: parsed.industry,
      ratio: parsed.ratio,
      title: parsed.title,
      subtitle: parsed.subtitle,
      cta: parsed.cta,
      colorStyle: parsed.colorStyle,
      brandTone: parsed.brandTone,
      customPrompt: parsed.customPrompt,
    });
    sendJson(res, 200, {
      ok: true,
      templateId: template.id,
      finalPrompt,
      ratio: parsed.ratio,
      type: parsed.type,
      industry: parsed.industry,
      allowedSizes: template.allowedSizes,
    });
    return true;
  }

  if (pathname === "/api/generate" && req.method === "POST") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const body = await requireBodyJson(req, res);
    if (!body) return true;
    const parsed = parseGeneratePayload(body);
    if (!parsed.ok) {
      sendJson(res, 400, { ok: false, error: parsed.error });
      return true;
    }
    if (!isAllowedTypeForUser(user, parsed.type)) {
      sendJson(res, 403, { ok: false, error: "Your invite code does not allow this type." });
      return true;
    }
    if ((user.quotaLeft || 0) < 1) {
      sendJson(res, 402, { ok: false, error: "Quota is not enough." });
      return true;
    }
    const source = user.inviterCodeId ? "invite" : "quota";
    const fingerprint = buildRequestFingerprint(user.id, parsed, source);
    const inFlight = findActiveJobByFingerprint(store.getAll(), user.id, fingerprint);
    if (inFlight) {
      sendJson(res, 200, {
        ok: true,
        merged: true,
        jobId: inFlight.id,
        status: inFlight.status,
        quotaLeft: user.quotaLeft,
        ratio: inFlight.ratio,
        allowedSizes: inFlight.allowedSizes || [],
        finalPrompt: inFlight.finalPrompt,
        templateId: inFlight.templateId || "",
      });
      return true;
    }

    const templates = getTemplates({ type: parsed.type, industry: parsed.industry });
    const template = templates[0];
    if (!template) {
      sendJson(res, 500, { ok: false, error: "Template not available." });
      return true;
    }
    if (!validateTemplateRatio(template, parsed.ratio)) {
      sendJson(res, 400, {
        ok: false,
        error: `Ratio ${parsed.ratio} is not supported for ${parsed.type} (${template.allowedSizes.join(", ")}).`,
      });
      return true;
    }

    const finalPrompt = buildPrompt({
      template,
      type: parsed.type,
      industry: parsed.industry,
      ratio: parsed.ratio,
      title: parsed.title,
      subtitle: parsed.subtitle,
      cta: parsed.cta,
      colorStyle: parsed.colorStyle,
      brandTone: parsed.brandTone,
      customPrompt: parsed.customPrompt,
    });

    const job = buildQueuedJob({
      user,
      input: parsed,
      prompt: finalPrompt,
      source,
      requestFingerprint: fingerprint,
      templateId: template.id,
      allowedSizes: template.allowedSizes || [],
    });
    store.withMutations((state) => {
      state.jobs.push(job);
      user.quotaLeft = Math.max(0, (user.quotaLeft || 0) - 1);
    });
    await store.save();
    sendJson(res, 200, {
      ok: true,
      jobId: job.id,
      status: job.status,
      quotaLeft: user.quotaLeft,
      ratio: parsed.ratio,
      allowedSizes: template.allowedSizes,
      finalPrompt,
      templateId: template.id,
    });

    void runGeneration(job.id, parsed.count, parseRatio(parsed.ratio));
    return true;
  }

  const rerollMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/reroll$/);
  if (rerollMatch && req.method === "POST") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const body = await requireBodyJson(req, res);
    if (!body) return true;
    const jobId = rerollMatch[1];
    const source = store.getAll().jobs.find((j) => j.id === jobId && j.userId === user.id);
    if (!source) {
      sendJson(res, 404, { ok: false, error: "Source job not found." });
      return true;
    }
    const override = body || {};
    const sourcePayload = source.inputPayload || {};
    const mergedInput = {
      type: override.type || source.type,
      industry: override.industry || source.industry,
      ratio: override.ratio || source.ratio,
      title: override.title || sourcePayload.title || "",
      subtitle: override.subtitle || sourcePayload.subtitle || "",
      cta: override.cta || sourcePayload.cta || "",
      colorStyle: override.colorStyle || sourcePayload.colorStyle || "",
      brandTone: override.brandTone || sourcePayload.brandTone || "",
      customPrompt: override.customPrompt || sourcePayload.customPrompt || "",
      count: Number(override.count || sourcePayload.count || 1),
    };

    const parsed = parseGeneratePayload(mergedInput);
    if (!parsed.ok) {
      sendJson(res, 400, { ok: false, error: parsed.error });
      return true;
    }
    if (!isAllowedTypeForUser(user, parsed.type)) {
      sendJson(res, 403, { ok: false, error: "Your invite code does not allow this type." });
      return true;
    }
    if ((user.quotaLeft || 0) < 1) {
      sendJson(res, 402, { ok: false, error: "Quota is not enough." });
      return true;
    }

    const templates = getTemplates({ type: parsed.type, industry: parsed.industry });
    const template = templates[0];
    if (!template) {
      sendJson(res, 500, { ok: false, error: "Template not available." });
      return true;
    }
    if (!validateTemplateRatio(template, parsed.ratio)) {
      sendJson(res, 400, {
        ok: false,
        error: `Ratio ${parsed.ratio} is not supported for ${parsed.type} (${template.allowedSizes.join(", ")}).`,
      });
      return true;
    }

    const finalPrompt = buildPrompt({
      template,
      type: parsed.type,
      industry: parsed.industry,
      ratio: parsed.ratio,
      title: parsed.title,
      subtitle: parsed.subtitle,
      cta: parsed.cta,
      colorStyle: parsed.colorStyle,
      brandTone: parsed.brandTone,
      customPrompt: parsed.customPrompt,
    });
    const fingerprint = buildRequestFingerprint(
      user.id,
      { ...parsed, source: "reroll", sourceJobId: source.id },
      "reroll"
    );
    const inFlight = findActiveJobByFingerprint(store.getAll(), user.id, fingerprint);
    if (inFlight) {
      sendJson(res, 200, {
        ok: true,
        merged: true,
        jobId: inFlight.id,
        status: inFlight.status,
        quotaLeft: user.quotaLeft,
        rerolledFrom: source.id,
      });
      return true;
    }

    const newJob = buildQueuedJob({
      user,
      input: parsed,
      prompt: finalPrompt,
      source: "reroll",
      requestFingerprint: fingerprint,
      templateId: template.id,
      allowedSizes: template.allowedSizes || [],
    });
    store.withMutations((state) => {
      state.jobs.push(newJob);
      user.quotaLeft = Math.max(0, (user.quotaLeft || 0) - 1);
    });
    await store.save();
    sendJson(res, 200, {
      ok: true,
      jobId: newJob.id,
      status: newJob.status,
      quotaLeft: user.quotaLeft,
      rerolledFrom: source.id,
    });
    void runGeneration(newJob.id, parsed.count, parseRatio(parsed.ratio));
    return true;
  }

  const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (jobMatch && req.method === "GET") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const jobId = jobMatch[1];
    const job = store.getAll().jobs.find((j) => j.id === jobId && j.userId === user.id);
    if (!job) {
      sendJson(res, 404, { ok: false, error: "Job not found." });
      return true;
    }
    sendJson(res, 200, { ok: true, job });
    return true;
  }

  const assetMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/assets$/);
  if (assetMatch && req.method === "GET") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const jobId = assetMatch[1];
    const job = store.getAll().jobs.find((j) => j.id === jobId && j.userId === user.id);
    if (!job) {
      sendJson(res, 404, { ok: false, error: "Job not found." });
      return true;
    }
    const assets = store.getAll().assets.filter((a) => a.jobId === jobId);
    sendJson(res, 200, { ok: true, assets });
    return true;
  }

  if (pathname === "/api/me/history" && req.method === "GET") {
    const user = assertAuth(req, res);
    if (!user) return true;
    const jobs = store.getAll().jobs.filter((j) => j.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const history = jobs.map((job) => {
      const assets = store.getAll().assets.filter((a) => a.jobId === job.id);
      return {
        ...job,
        assetCount: assets.length,
        previewImage: assets[0]?.url || null,
      };
    });
    sendJson(res, 200, { ok: true, history });
    return true;
  }

  if (pathname === "/api/me/profile" && req.method === "GET") {
    const user = assertAuth(req, res);
    if (!user) return true;
    sendJson(res, 200, {
      ok: true,
      user: {
        id: user.id,
        emailOrPhone: user.emailOrPhone,
        quotaLeft: user.quotaLeft || 0,
        planId: user.planId || "free",
        allowedTypes: user.allowedTypes || [],
        inviterCodeId: user.inviterCodeId || null,
      },
    });
    return true;
  }

  if (pathname === "/api/admin/invite-codes" && req.method === "POST") {
    if (!requireAdminAuth(req, res)) {
      return true;
    }
    const body = await requireBodyJson(req, res);
    if (!body) return true;

    const code = safeText(body.code);
    if (!code) {
      sendJson(res, 400, { ok: false, error: "code is required." });
      return true;
    }
    const exists = findInviteCode(code);
    if (exists) {
      sendJson(res, 400, { ok: false, error: "Code already exists." });
      return true;
    }

    const inviteCode = {
      id: genId("icode"),
      code,
      codeType: safeText(body.codeType || "activity"),
      quotaTotal: Number(body.quotaTotal || 0),
      quotaUsed: 0,
      quotaGrant: Number(body.quotaGrant || 0),
      maxUsesPerUser: Number(body.maxUsesPerUser || 1),
      expiresAt: safeText(body.expiresAt || ""),
      allowedTypes: Array.isArray(body.allowedTypes) ? body.allowedTypes.filter((item) => ALLOWED_TYPES.includes(String(item))) : [],
      planOverride: safeText(body.planOverride || ""),
      status: safeText(body.status || "active"),
      createdAt: nowIso(),
      usedBy: [],
    };
    store.withMutations((state) => {
      state.inviteCodes.push(inviteCode);
    });
    await store.save();
    const state = store.getAll();
    recordAdminLog(state, req, { ok: true, action: req.method, reason: "create_invite_code", inviteCode: inviteCode.code });
    store.save().catch(() => {});
    sendJson(res, 200, { ok: true, inviteCode });
    return true;
  }

  return false;
}

async function serveStatic(res, pathname) {
  let filePath;
  if (pathname === "/") {
    filePath = path.join(PUBLIC_DIR, "index.html");
  } else if (pathname.startsWith("/assets/")) {
    const fileName = pathname.replace(/^\/assets\//, "");
    filePath = path.join(ASSETS_DIR, fileName);
  } else if (pathname.startsWith("/")) {
    const safe = pathname.replace(/\.\./g, "");
    filePath = path.join(PUBLIC_DIR, safe);
  } else {
    sendJson(res, 404, { ok: false, error: "Not found." });
    return true;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": FILE_MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
  } catch {
    return false;
  }
  return true;
}

async function proxyToFrontend(req, res, pathname) {
  if (!FRONTEND_PROXY_ORIGIN) return false;
  if (!pathname.startsWith("/")) return false;
  if (req.method !== "GET") return false;

  const targetUrl = new URL(pathname + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""), FRONTEND_PROXY_ORIGIN);
  try {
    const upstream = await fetch(targetUrl.href, {
      method: req.method,
      headers: {
        "user-agent": req.headers["user-agent"] || "Mozilla/5.0",
      },
    });
    const data = Buffer.from(await upstream.arrayBuffer());
    const headers = {};
    upstream.headers.forEach((v, k) => {
      headers[k] = v;
    });
    res.writeHead(upstream.status, headers);
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

async function initSeedData() {
  await store.init();
  if (!store.getAll().inviteCodes?.length) {
    store.withMutations((state) => {
      state.inviteCodes.push({
        id: genId("icode"),
        code: "DEMO2026",
        codeType: "activity",
        quotaTotal: 20,
        quotaUsed: 0,
        quotaGrant: 20,
        maxUsesPerUser: 1,
        expiresAt: "",
        allowedTypes: [],
        planOverride: "",
        status: "active",
        createdAt: nowIso(),
        usedBy: [],
      });
    });
    await store.save();
  }
}

await initSeedData();
await fs.mkdir(ASSETS_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://localhost`);
  const pathname = requestUrl.pathname;

  const handled = await handleApi(req, res, pathname);
  if (handled) return;

  if (req.method === "GET" && FRONTEND_PROXY_ORIGIN && !pathname.startsWith("/api") && !pathname.startsWith("/assets/")) {
    if (await proxyToFrontend(req, res, pathname)) return;
  }

  const served = await serveStatic(res, pathname);
  if (served) return;
  sendText(res, 404, "Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
