"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Brush,
  Check,
  ChevronDown,
  CircleDollarSign,
  Copy,
  FileText,
  ImageIcon,
  ImagePlus,
  Layers3,
  Loader2,
  Maximize2,
  Megaphone,
  Package,
  Palette,
  Presentation,
  RefreshCw,
  Rocket,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useStore } from "@/lib/store"
import { useGeneration, type GenerateParams } from "@/lib/generation"
import {
  IMAGE_TYPES,
  INDUSTRIES,
  RATIOS,
  buildFinalPrompt,
  detectType,
  CUSTOM_PROMPT_MAX,
  type ImageType,
  type Industry,
  type AspectRatio,
} from "@/lib/templates"
import { ResultCards } from "@/components/result-cards"

const TYPE_ICONS: Record<ImageType, typeof FileText> = {
  poster: Megaphone,
  product_shot: Package,
  social_post: ImageIcon,
  banner: Presentation,
  cover: BookOpen,
}

const SIZE_LABELS: Record<AspectRatio, string> = {
  "1:1": "方形素材",
  "4:5": "电商竖版",
  "16:9": "横幅广告",
  "9:16": "短视频竖屏",
}

const TEMPLATE_PACKS: {
  name: string
  scene: string
  title: string
  detail: string
  type: ImageType
  industry: Industry
  size: AspectRatio
}[] = [
  {
    name: "爆款商品首图",
    scene: "电商转化",
    title: "新品上市电商详情页首屏",
    detail: "产品居中展示，突出材质、卖点和使用场景，背景简洁高级，预留价格和卖点标签区域。",
    type: "product_shot",
    industry: "ecommerce",
    size: "4:5",
  },
  {
    name: "活动促销海报",
    scene: "私域传播",
    title: "618 限时促销活动海报",
    detail: "强视觉主标题，促销氛围明确，包含利益点、倒计时区域和行动按钮留白。",
    type: "poster",
    industry: "ecommerce",
    size: "4:5",
  },
  {
    name: "课程招生封面",
    scene: "知识付费",
    title: "训练营招生课程封面",
    detail: "专业可信赖，标题醒目，包含讲师、课程收益和报名引导的视觉空间。",
    type: "cover",
    industry: "education",
    size: "1:1",
  },
  {
    name: "品牌 Banner",
    scene: "站内投放",
    title: "春季品牌活动 Banner",
    detail: "横向构图，左侧文字区，右侧产品或人物主视觉，高级商业质感。",
    type: "banner",
    industry: "it",
    size: "16:9",
  },
]

const STYLE_PRESETS = [
  { name: "智能适配", color: "linear-gradient(135deg,#f8fafc,#e2e8f0)", prompt: "" },
  { name: "经典黑白", color: "linear-gradient(135deg,#111827,#f8fafc)", prompt: "经典黑白，高对比，干净高级。" },
  { name: "海洋蓝", color: "linear-gradient(135deg,#0ea5e9,#1e3a8a)", prompt: "海洋蓝色系，清爽、专业、科技感。" },
  { name: "夕阳橙", color: "linear-gradient(135deg,#fb923c,#ef4444)", prompt: "夕阳橙色系，温暖、有活力、强转化。" },
  { name: "森林绿", color: "linear-gradient(135deg,#22c55e,#14532d)", prompt: "森林绿色系，自然、健康、可信赖。" },
  { name: "玫瑰粉", color: "linear-gradient(135deg,#fb7185,#be185d)", prompt: "玫瑰粉色系，柔和、精致、适合女性消费品。" },
]

const BRAND_TAGS = ["品牌主色", "Logo 安全区", "卖点词库", "同款风格", "投放尺寸"]

export function GeneratePanel() {
  const { user, inviteQuota, appliedCode, applyInviteCode, reversePromptDraft } = useStore()
  const { generate, loading, currentJob } = useGeneration()

  const [type, setType] = useState<ImageType>("poster")
  const [industry, setIndustry] = useState<Industry>("ecommerce")
  const [size, setSize] = useState<AspectRatio>("4:5")
  const [title, setTitle] = useState("")
  const [detail, setDetail] = useState("")
  const [count, setCount] = useState(1)
  const [customPrompt, setCustomPrompt] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false)
  const [styleMenuOpen, setStyleMenuOpen] = useState(false)
  const [stylePreset, setStylePreset] = useState(STYLE_PRESETS[0])

  useEffect(() => {
    if (!reversePromptDraft) return
    if (!customPrompt.trim()) {
      setCustomPrompt(reversePromptDraft.slice(0, CUSTOM_PROMPT_MAX))
      toast.success("已回填反推风格草稿")
    }
  }, [reversePromptDraft, customPrompt])

  const finalPrompt = useMemo(
    () =>
      buildFinalPrompt({
        type,
        industry,
        title,
        detail,
        customPrompt: [customPrompt, stylePreset.prompt].filter(Boolean).join(" "),
      }),
    [type, industry, title, detail, customPrompt, stylePreset],
  )

  const selectedType = IMAGE_TYPES.find((item) => item.value === type)
  const selectedIndustry = INDUSTRIES.find((item) => item.value === industry)
  const detected = useMemo(() => detectType(`${title} ${detail}`), [title, detail])
  const totalQuota = (user?.quota ?? 0) + inviteQuota
  const readiness = [
    { label: "场景模板", ok: Boolean(type) },
    { label: "商业需求", ok: Boolean(title.trim() || detail.trim()) },
    { label: "品牌风格", ok: stylePreset.name !== "智能适配" || Boolean(customPrompt.trim()) },
    { label: "输出规格", ok: Boolean(size) },
  ]

  const handleApplyCode = () => {
    const res = applyInviteCode(codeInput)
    if (res.ok) {
      toast.success(res.message)
      setCodeInput("")
    } else {
      toast.error(res.message)
    }
  }

  const handleTemplate = (item: (typeof TEMPLATE_PACKS)[number]) => {
    setTitle(item.title)
    setDetail(item.detail)
    setType(item.type)
    setIndustry(item.industry)
    setSize(item.size)
  }

  const handleGenerate = () => {
    const params: GenerateParams = {
      type,
      industry,
      size,
      title,
      detail,
      customPrompt,
      finalPrompt,
      count,
    }
    generate(params)
  }

  const handleReroll = () => {
    if (!currentJob) return
    generate({
      type: currentJob.type,
      industry: currentJob.industry,
      size: currentJob.size,
      title: currentJob.title,
      detail: currentJob.detail,
      customPrompt: currentJob.customPrompt,
      finalPrompt: currentJob.finalPrompt,
      count: currentJob.count,
    })
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-slate-200 bg-[#10130f] p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="rounded-full bg-lime-300 text-slate-950 hover:bg-lime-300">
                Campaign Studio V2
              </Badge>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">
                生成可投放的商业视觉，而不是一张随机图片
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/62">
                从模板、品牌风格、比例到生成结果归档，把营销素材生产变成稳定工作流。
              </p>
            </div>
            <Button className="rounded-full bg-white text-slate-950 hover:bg-lime-100" onClick={handleGenerate} disabled={loading || totalQuota < count}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              生成素材
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Sparkles, label: "当前模式", value: selectedType?.label || "宣传海报" },
              { icon: ShieldCheck, label: "品牌控制", value: stylePreset.name },
              { icon: CircleDollarSign, label: "可用额度", value: `${totalQuota} 次` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <item.icon className="size-5 text-lime-200" />
                <p className="mt-3 text-xs text-white/45">{item.label}</p>
                <p className="mt-1 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">品牌资产</p>
              <p className="mt-1 text-xs text-slate-500">商业一致性控制</p>
            </div>
            <Badge variant="outline" className="rounded-full">Demo</Badge>
          </div>
          <div className="mt-5 flex gap-2">
            {["#111827", "#d9f99d", "#f97316", "#0ea5e9"].map((color) => (
              <span key={color} className="size-9 rounded-full border border-slate-200" style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {BRAND_TAGS.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">建议</p>
            <p className="mt-2 text-sm leading-6">
              先选择模板，再补充卖点和目标人群，输出会更接近可投放素材。
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">模板起点</p>
            <p className="text-xs text-slate-500">按商业场景快速进入生成</p>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full">
            查看全部
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {TEMPLATE_PACKS.map((item) => (
            <button
              type="button"
              key={item.name}
              onClick={() => handleTemplate(item)}
              className={cn(
                "group rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                title === item.title ? "border-slate-950" : "border-slate-200",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                  {item.scene}
                </Badge>
                <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-slate-950" />
              </div>
              <h3 className="mt-4 font-semibold">{item.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.detail}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">创作台</p>
                <p className="mt-1 text-sm text-slate-500">输入商业目标、卖点和画面要求</p>
              </div>
              {detected && detected !== type ? (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setType(detected)}>
                  切换为 {IMAGE_TYPES.find((item) => item.value === detected)?.label}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-5">
              {IMAGE_TYPES.map((item) => {
                const Icon = TYPE_ICONS[item.value]
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setType(item.value)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-center transition",
                      type === item.value
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white hover:text-slate-950",
                    )}
                  >
                    <Icon className="mx-auto size-5" />
                    <span className="mt-2 block text-xs font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-[#fbfbf7]">
              <div className="p-4 sm:p-5">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={`让智图帮你设计 ${selectedType?.label || "营销图"}`}
                  className="h-11 border-0 bg-transparent px-0 text-lg font-semibold shadow-none placeholder:text-slate-300 focus-visible:ring-0"
                />
                <Textarea
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  placeholder="描述产品、卖点、目标人群、投放渠道、画面元素、文字留白和参考风格..."
                  rows={5}
                  className="min-h-32 resize-none border-0 bg-transparent px-0 text-base leading-7 shadow-none placeholder:text-slate-300 focus-visible:ring-0"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-slate-600 hover:bg-white"
                    title="参考图"
                  >
                    <ImagePlus className="size-4" />
                    参考图
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-slate-600 hover:bg-white",
                        sizeMenuOpen && "bg-white text-slate-950",
                      )}
                      title="尺寸选择"
                      onClick={() => {
                        setSizeMenuOpen((value) => !value)
                        setStyleMenuOpen(false)
                      }}
                    >
                      <Maximize2 className="size-4" />
                      {size}
                      <ChevronDown className={cn("size-4 text-slate-300 transition", sizeMenuOpen && "rotate-180")} />
                    </button>
                    {sizeMenuOpen ? (
                      <div className="absolute left-0 top-11 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                        {RATIOS.map((item) => (
                          <button
                            type="button"
                            key={item.value}
                            onClick={() => {
                              setSize(item.value)
                              setSizeMenuOpen(false)
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
                              size === item.value ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100",
                            )}
                          >
                            <span className="font-medium">{item.value}</span>
                            <span className={cn("text-xs", size === item.value ? "text-white/70" : "text-slate-400")}>
                              {SIZE_LABELS[item.value]}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-slate-600 hover:bg-white",
                        styleMenuOpen && "bg-white text-slate-950",
                      )}
                      title="品牌风格"
                      onClick={() => {
                        setStyleMenuOpen((value) => !value)
                        setSizeMenuOpen(false)
                      }}
                    >
                      <Palette className="size-4" />
                      {stylePreset.name}
                    </button>
                    {styleMenuOpen ? (
                      <div className="absolute left-0 top-11 z-30 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                        <div className="grid grid-cols-2 gap-1.5">
                          {STYLE_PRESETS.map((item) => (
                            <button
                              type="button"
                              key={item.name}
                              onClick={() => {
                                setStylePreset(item)
                                setStyleMenuOpen(false)
                              }}
                              className={cn(
                                "flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition",
                                stylePreset.name === item.name ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100",
                              )}
                            >
                              <span className="size-4 rounded-full border border-white/60" style={{ background: item.color }} />
                              <span className="truncate">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-slate-500">
                    <Sparkles className="size-4 text-blue-500" />
                    gpt-image-2
                  </span>
                  <span className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm text-slate-500">
                    <Layers3 className="size-4" />
                    {count}
                  </span>
                  <Button
                    type="button"
                    disabled={loading || totalQuota < count}
                    onClick={handleGenerate}
                    className="h-11 rounded-full bg-[linear-gradient(135deg,#d9f99d_0%,#f97316_48%,#111827_100%)] px-7 text-white shadow-[0_12px_30px_rgba(249,115,22,0.24)] hover:opacity-95"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                    生成
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">行业场景</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {INDUSTRIES.map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => setIndustry(item.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        industry === item.value
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:text-slate-950",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">生成数量</Label>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
                    <span>{count} 张</span>
                    <span>额度 {totalQuota}</span>
                  </div>
                  <Slider
                    min={1}
                    max={4}
                    step={1}
                    value={[count]}
                    onValueChange={(value) => setCount(Array.isArray(value) ? value[0] : value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="size-4" />
                  高级提示词
                </Label>
                <span className="text-xs text-slate-400">{customPrompt.length}/{CUSTOM_PROMPT_MAX}</span>
              </div>
              <Textarea
                rows={3}
                maxLength={CUSTOM_PROMPT_MAX}
                placeholder="补充镜头、灯光、材质、风格，或粘贴反推提示词"
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                className="mt-3 resize-none bg-white"
              />
              {!!reversePromptDraft ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-full"
                  onClick={() => setCustomPrompt(reversePromptDraft.slice(0, CUSTOM_PROMPT_MAX))}
                >
                  <Brush className="size-4" />
                  使用反推草稿
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">输出检查</p>
                <p className="mt-1 text-xs text-slate-500">生成前的商业完整度</p>
              </div>
              <Badge variant="outline" className="rounded-full">{readiness.filter((item) => item.ok).length}/4</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {readiness.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  {item.ok ? <BadgeCheck className="size-4 text-emerald-500" /> : <AlertCircle className="size-4 text-slate-300" />}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Ticket className="size-4" />
                邀请码
              </Label>
              {appliedCode ? (
                <Badge variant="secondary" className="gap-1 rounded-full">
                  <Check className="size-3" />
                  {appliedCode}
                </Badge>
              ) : null}
            </div>
            {appliedCode ? (
              <p className="mt-3 text-sm text-slate-500">赠送额度剩余 {inviteQuota} 次</p>
            ) : (
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="WELCOME20"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                />
                <Button variant="outline" onClick={handleApplyCode}>
                  激活
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-[#fff7ed] p-5">
            <div className="flex items-center gap-2">
              <Copy className="size-4 text-orange-600" />
              <p className="text-sm font-semibold">最终提示词</p>
            </div>
            <p className="mt-3 max-h-44 overflow-auto text-xs leading-6 text-slate-600">
              {finalPrompt}
            </p>
          </div>
        </aside>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">输出工作区</p>
            <p className="mt-1 text-xs text-slate-500">生成结果会在这里下载、重绘、归档</p>
          </div>
          {currentJob ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleReroll} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              换一批
            </Button>
          ) : null}
        </div>
        {loading && (!currentJob || currentJob.status === "failed") ? (
          <ResultSkeleton size={size} count={count} />
        ) : currentJob ? (
          currentJob.status === "failed" ? (
            <FailedState onRetry={handleReroll} loading={loading} />
          ) : (
            <ResultCards job={currentJob} loading={loading} onReroll={handleReroll} />
          )
        ) : (
          <EmptyState typeName={selectedType?.label || "营销图"} industryName={selectedIndustry?.label || "电商零售"} />
        )}
      </section>
    </div>
  )
}

function EmptyState({ typeName, industryName }: { typeName: string; industryName: string }) {
  return (
    <Card className="min-h-[280px] border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
        <Sparkles className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-medium text-slate-900">等待生成第一批商业素材</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        当前选择：{industryName} / {typeName}。生成后可下载、换一批、复用提示词。
      </p>
    </Card>
  )
}

function ResultSkeleton({ size, count }: { size: AspectRatio; count: number }) {
  const box = RATIOS.find((item) => item.value === size)?.box ?? "aspect-square"
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn("rounded-2xl bg-slate-100 animate-pulse", box)} />
      ))}
    </div>
  )
}

function FailedState({ onRetry, loading }: { onRetry: () => void; loading: boolean }) {
  return (
    <Card className="min-h-[280px] bg-white p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-medium">生成失败</h3>
      <p className="mt-1 text-sm text-muted-foreground">可能是模型超时或服务波动，本次未扣减额度。</p>
      <Button className="mt-5 rounded-full" variant="outline" onClick={onRetry} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        重试
      </Button>
    </Card>
  )
}
