// 提示词模板库、分类分流配置与安全词库

export type ImageType = "poster" | "product_shot" | "social_post" | "banner" | "cover"
export type Industry =
  | "ecommerce"
  | "food"
  | "education"
  | "fitness"
  | "tourism"
  | "finance"
  | "beauty"
  | "it"
export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16"

export const IMAGE_TYPES: { value: ImageType; label: string; desc: string }[] = [
  { value: "poster", label: "宣传海报", desc: "活动 / 节日 / 品牌海报" },
  { value: "product_shot", label: "电商产品图", desc: "白底主图 / 场景图" },
  { value: "social_post", label: "社媒配图", desc: "朋友圈 / 小红书 / 公众号" },
  { value: "banner", label: "横幅广告", desc: "投放 Banner / 首页 Banner" },
  { value: "cover", label: "封面图", desc: "视频 / 文章 / 课程封面" },
]

export const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: "ecommerce", label: "电商零售" },
  { value: "food", label: "餐饮美食" },
  { value: "education", label: "教育培训" },
  { value: "fitness", label: "运动健身" },
  { value: "tourism", label: "旅游出行" },
  { value: "finance", label: "金融理财" },
  { value: "beauty", label: "美妆个护" },
  { value: "it", label: "互联网/科技" },
]

export const RATIOS: { value: AspectRatio; label: string; box: string }[] = [
  { value: "1:1", label: "方形 1:1", box: "aspect-square" },
  { value: "4:5", label: "竖图 4:5", box: "aspect-[4/5]" },
  { value: "16:9", label: "横图 16:9", box: "aspect-video" },
  { value: "9:16", label: "竖屏 9:16", box: "aspect-[9/16]" },
]

// Imagen 支持的比例映射
export const RATIO_TO_IMAGEN: Record<AspectRatio, string> = {
  "1:1": "1:1",
  "4:5": "3:4",
  "16:9": "16:9",
  "9:16": "9:16",
}

// 全局基础模板
const BASE_GLOBAL =
  "专业商业级视觉作品，高分辨率，构图平衡，主体突出，光影自然，色彩协调，干净留白，适合直接用于营销投放。"

const TYPE_PROMPT: Record<ImageType, string> = {
  poster: "海报排版，主标题区域留白用于后期加字，视觉冲击力强，层次分明。",
  product_shot: "电商产品摄影，柔和棚拍光源，背景简洁干净，突出材质与质感，细节清晰。",
  social_post: "社交媒体风格，年轻化潮流审美，氛围感强，适合手机端浏览。",
  banner: "横向广告横幅，左右构图留出文案空间，主体清晰，引导视线。",
  cover: "封面视觉，中心聚焦，标题区域明确，吸引点击。",
}

const INDUSTRY_PROMPT: Record<Industry, string> = {
  ecommerce: "电商促销氛围，商品质感真实，价格标签风格留白。",
  food: "诱人的美食特写，新鲜食材，暖色调，食欲感强。",
  education: "知识与成长主题，明亮清新，专业可信赖。",
  fitness: "活力运动感，动态张力，健康阳光，肌肉线条与汗水细节。",
  tourism: "壮美风景或旅行场景，明媚自然光，向往感与代入感。",
  finance: "稳健专业，科技蓝金色调，信任与高端质感。",
  beauty: "精致细腻，柔焦质感，高级感配色，肌肤与产品光泽。",
  it: "现代科技感，简洁几何，未来感配色，数字化氛围。",
}

// 固定反向提示词
const SAFE_GUARDRAILS =
  "避免：水印、文字乱码、logo 侵权、低分辨率、畸形、多余肢体、杂乱背景、暴力血腥、违法违规内容。"

// 安全策略：禁止词库
export const BANNED_WORDS = [
  "水印",
  "watermark",
  "裸露",
  "色情",
  "暴力",
  "血腥",
  "毒品",
  "枪支",
  "政治",
]

export const CUSTOM_PROMPT_MAX = 300

export interface BuildPromptInput {
  type: ImageType
  industry: Industry
  title?: string
  detail?: string
  customPrompt?: string
}

// final_prompt = base_global + type_prompt + industry_prompt + user_fields + safe_guardrails
export function buildFinalPrompt(input: BuildPromptInput): string {
  const parts: string[] = [BASE_GLOBAL, TYPE_PROMPT[input.type], INDUSTRY_PROMPT[input.industry]]
  const userFields: string[] = []
  if (input.title?.trim()) userFields.push(`主题/标题：${input.title.trim()}`)
  if (input.detail?.trim()) userFields.push(`需求描述：${input.detail.trim()}`)
  if (userFields.length) parts.push(userFields.join("；"))
  if (input.customPrompt?.trim()) parts.push(`额外风格：${input.customPrompt.trim()}`)
  parts.push(SAFE_GUARDRAILS)
  return parts.join(" ")
}

// 命中词库的自动类型识别
const TYPE_KEYWORDS: Record<ImageType, string[]> = {
  poster: ["海报", "活动", "宣传", "节日", "促销海报"],
  product_shot: ["产品", "主图", "白底", "商品", "电商图"],
  social_post: ["朋友圈", "小红书", "公众号", "社媒", "种草"],
  banner: ["banner", "横幅", "投放", "广告位"],
  cover: ["封面", "视频封面", "课程封面", "文章封面"],
}

export function detectType(text: string): ImageType | null {
  const lower = text.toLowerCase()
  for (const [type, words] of Object.entries(TYPE_KEYWORDS)) {
    if (words.some((w) => lower.includes(w.toLowerCase()))) {
      return type as ImageType
    }
  }
  return null
}

export function checkBannedWords(text: string): string[] {
  const lower = text.toLowerCase()
  return BANNED_WORDS.filter((w) => lower.includes(w.toLowerCase()))
}

export function typeLabel(t: ImageType) {
  return IMAGE_TYPES.find((x) => x.value === t)?.label ?? t
}
export function industryLabel(i: Industry) {
  return INDUSTRIES.find((x) => x.value === i)?.label ?? i
}
