import { experimental_generateImage as generateImage } from "ai"
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
  const aspectRatio = RATIO_TO_IMAGEN[size] ?? "1:1"

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

  // 未配置 AI Gateway 凭证时，直接进入 demo 占位模式
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(buildPlaceholders("当前为演示模式：未配置 AI_GATEWAY_API_KEY，已返回占位图。"))
  }

  try {
    const { images } = await generateImage({
      model: "google/imagen-4.0-fast-generate-001",
      prompt,
      n,
      aspectRatio: aspectRatio as `${number}:${number}`,
    })

    const assets = images.map((img) => ({
      url: `data:${img.mediaType ?? "image/png"};base64,${img.base64}`,
      format: (img.mediaType ?? "image/png").split("/")[1] ?? "png",
    }))

    return Response.json({ assets, demo: false })
  } catch (err) {
    console.log("[v0] image generation error:", err instanceof Error ? err.message : err)
    // 生成失败时回退到占位图，保证原型流程可用
    return Response.json(buildPlaceholders("模型暂时不可用，已返回占位图。"))
  }
}
