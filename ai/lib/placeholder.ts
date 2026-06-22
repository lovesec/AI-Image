import type { AspectRatio } from "@/lib/templates"

const RATIO_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 768, h: 768 },
  "4:5": { w: 720, h: 900 },
  "9:16": { w: 600, h: 1067 },
  "16:9": { w: 1067, h: 600 },
}

// 与品牌主色协调的几组配色（深底 + 亮色点缀）
const PALETTES = [
  { bg: "#0f1f3d", grad: "#1d4ed8", accent: "#60a5fa", text: "#f8fafc" },
  { bg: "#1a1333", grad: "#4338ca", accent: "#a5b4fc", text: "#f8fafc" },
  { bg: "#0b2540", grad: "#0e7490", accent: "#67e8f9", text: "#f8fafc" },
  { bg: "#2a1015", grad: "#b91c1c", accent: "#fca5a5", text: "#fff7ed" },
]

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** 生成一张带文案与配色的 SVG 占位图（demo 模式），返回 data URI */
export function makePlaceholder(opts: {
  size: AspectRatio
  title: string
  subtitle: string
  index: number
}): { url: string; format: string } {
  const { w, h } = RATIO_DIMS[opts.size] ?? RATIO_DIMS["1:1"]
  const p = PALETTES[opts.index % PALETTES.length]
  const title = esc(opts.title.slice(0, 18) || "营销主图")
  const subtitle = esc(opts.subtitle.slice(0, 24))
  const cx = w / 2

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bg}"/>
      <stop offset="100%" stop-color="${p.grad}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.82}" cy="${h * 0.18}" r="${w * 0.18}" fill="${p.accent}" opacity="0.18"/>
  <circle cx="${w * 0.16}" cy="${h * 0.86}" r="${w * 0.12}" fill="${p.accent}" opacity="0.14"/>
  <text x="${cx}" y="${h * 0.42}" fill="${p.text}" font-size="${Math.round(w * 0.085)}" font-weight="700" font-family="sans-serif" text-anchor="middle">${title}</text>
  <text x="${cx}" y="${h * 0.42 + Math.round(w * 0.07)}" fill="${p.accent}" font-size="${Math.round(w * 0.04)}" font-family="sans-serif" text-anchor="middle">${subtitle}</text>
  <rect x="${cx - w * 0.14}" y="${h * 0.58}" width="${w * 0.28}" height="${Math.round(w * 0.075)}" rx="${Math.round(w * 0.04)}" fill="${p.accent}"/>
  <text x="${cx}" y="${h * 0.58 + Math.round(w * 0.05)}" fill="${p.bg}" font-size="${Math.round(w * 0.032)}" font-weight="600" font-family="sans-serif" text-anchor="middle">立即抢购</text>
  <text x="${cx}" y="${h - 24}" fill="${p.text}" font-size="${Math.round(w * 0.022)}" font-family="sans-serif" text-anchor="middle" opacity="0.6">DEMO 占位图 · 接入 AI Gateway 后输出真实图片</text>
</svg>`

  const url = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
  return { url, format: "svg" }
}
