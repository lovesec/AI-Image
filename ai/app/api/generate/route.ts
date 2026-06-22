import { RATIO_TO_IMAGEN, type AspectRatio } from "@/lib/templates"
import { makePlaceholder } from "@/lib/placeholder"
import { getUserFromRequest } from "@/lib/server/auth"

export const runtime = "nodejs"
export const maxDuration = 60

interface GenerateBody {
  prompt: string
  size: AspectRatio
  count: number
  // demo 占位图所需的展示文案
  title?: string
  subtitle?: string
}

const RATIO_TO_LITELLM_SIZE: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "4:5": "1024x1280",
  "16:9": "1792x1024",
  "9:16": "1024x1792",
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "")
}

function normalizeImageAsset(item: unknown) {
  const asset = item as { b64_json?: string; base64?: string; url?: string; revised_prompt?: string }
  const base64 = asset.b64_json || asset.base64
  if (base64) {
    return {
      url: base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`,
      width: 0,
      height: 0,
      format: "png",
    }
  }
  if (asset.url) {
    return {
      url: asset.url,
      width: 0,
      height: 0,
      format: asset.url.split(".").pop()?.split("?")[0] || "png",
    }
  }
  return null
}

async function generateWithLiteLLM({
  prompt,
  size,
  n,
}: {
  prompt: string
  size: AspectRatio
  n: number
}) {
  const apiKey = process.env.LITELLM_API_KEY
  const baseUrl = process.env.LITELLM_API_BASE || process.env.LITELLM_BASE_URL
  const model = process.env.LITELLM_IMAGE_MODEL || "imagen-4.0-ultra"

  if (!apiKey || !baseUrl) return null

  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n,
      size: RATIO_TO_LITELLM_SIZE[size],
      aspect_ratio: RATIO_TO_IMAGEN[size] ?? "1:1",
      response_format: "b64_json",
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.error?.message === "string"
          ? data.error.message
          : `LiteLLM 图片生成失败（HTTP ${res.status}）`
    throw new Error(message)
  }

  const assets = Array.isArray(data?.data)
    ? data.data.map(normalizeImageAsset).filter(Boolean)
    : Array.isArray(data?.assets)
      ? data.assets.map(normalizeImageAsset).filter(Boolean)
      : []

  if (!assets.length) {
    throw new Error("LiteLLM 返回结果中没有图片数据")
  }

  return { assets, provider: "litellm", model }
}

export async function POST(req: Request) {
  if (process.env.REQUIRE_AUTH_FOR_GENERATION !== "false") {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ error: "请先登录后再生成图片", code: "unauthorized" }, { status: 401 })
    }
  }

  let body: GenerateBody
  try {
    body = (await req.json()) as GenerateBody
  } catch {
    return Response.json({ error: "参数错误", code: "bad_request" }, { status: 400 })
  }

  const { prompt, size, count, title, subtitle } = body
  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "缺少有效的提示词", code: "param_error" }, { status: 400 })
  }

  const n = Math.min(Math.max(Number(count) || 1, 1), 4)

  const buildPlaceholders = (note: string) => ({
    assets: Array.from({ length: n }, (_, i) =>
      makePlaceholder({
        size,
        title: title || "营销主图",
        subtitle: subtitle || prompt.slice(0, 20),
        index: i,
      }),
    ),
    demo: true as const,
    note,
  })

  try {
    const litellm = await generateWithLiteLLM({ prompt, size, n })
    if (!litellm) {
      return Response.json(buildPlaceholders("当前为演示模式：未配置 LITELLM_API_KEY / LITELLM_API_BASE，已返回占位图。"))
    }

    return Response.json({ assets: litellm.assets, demo: false, provider: litellm.provider, model: litellm.model })
  } catch (err) {
    console.log("[image generation error]", err instanceof Error ? err.message : err)
    // 生成失败时回退到占位图，保证原型流程可用
    return Response.json(buildPlaceholders(err instanceof Error ? `模型暂时不可用：${err.message}` : "模型暂时不可用，已返回占位图。"))
  }
}
