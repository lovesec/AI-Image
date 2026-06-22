"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  CircleDollarSign,
  Copy,
  FileText,
  ImageIcon,
  Layers3,
  Loader2,
  Maximize2,
  Megaphone,
  Package,
  Palette,
  Presentation,
  Rocket,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wand2,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useGeneration, type GenerateParams } from "@/lib/generation"
import {
  CUSTOM_PROMPT_MAX,
  IMAGE_TYPES,
  INDUSTRIES,
  RATIOS,
  buildFinalPrompt,
  detectType,
  type AspectRatio,
  type ImageType,
  type Industry,
} from "@/lib/templates"
import { ResultCards } from "@/components/result-cards"

const TYPE_ICONS: Record<ImageType, typeof FileText> = {
  poster: Megaphone,
  product_shot: Package,
  social_post: ImageIcon,
  banner: Presentation,
  cover: BookOpen,
}

const RATIO_META: Record<AspectRatio, { label: string; use: string; frame: string; hint: string }> = {
  "1:1": { label: "1:1", use: "社媒方图", frame: "aspect-square", hint: "朋友圈 / 小红书封面" },
  "4:5": { label: "4:5", use: "电商/信息流", frame: "aspect-[4/5]", hint: "主图 / 信息流投放" },
  "16:9": { label: "16:9", use: "Banner", frame: "aspect-video", hint: "官网 / 广告横幅" },
  "9:16": { label: "9:16", use: "短视频竖屏", frame: "aspect-[9/16]", hint: "竖版海报 / 视频封面" },
}

const TEMPLATE_PACKS: {
  name: string
  scene: string
  title: string
  detail: string
  type: ImageType
  industry: Industry
  size: AspectRatio
  accent: string
  preview: string
}[] = [
  {
    name: "爆款商品首图",
    scene: "电商转化",
    title: "新品上市电商详情页首屏",
    detail: "产品居中展示，突出材质、卖点和使用场景，背景简洁高级，预留价格和卖点标签区域。",
    type: "product_shot",
    industry: "ecommerce",
    size: "4:5",
    accent: "from-orange-300 via-stone-50 to-lime-200",
    preview: "Product Hero",
  },
  {
    name: "私域活动海报",
    scene: "促销裂变",
    title: "618 限时促销活动海报",
    detail: "强视觉主标题，促销氛围明确，包含利益点、倒计时区域和行动按钮留白。",
    type: "poster",
    industry: "ecommerce",
    size: "4:5",
    accent: "from-rose-200 via-orange-100 to-amber-200",
    preview: "Campaign",
  },
  {
    name: "课程招生封面",
    scene: "知识付费",
    title: "训练营招生课程封面",
    detail: "专业可信赖，标题醒目，包含讲师、课程收益和报名引导的视觉空间。",
    type: "cover",
    industry: "education",
    size: "1:1",
    accent: "from-sky-200 via-white to-slate-200",
    preview: "Course Cover",
  },
  {
    name: "官网 Hero Banner",
    scene: "品牌官网",
    title: "春季品牌活动 Banner",
    detail: "横向构图，左侧文字区，右侧产品或人物主视觉，高级商业质感。",
    type: "banner",
    industry: "it",
    size: "16:9",
    accent: "from-slate-300 via-cyan-100 to-lime-100",
    preview: "Hero Banner",
  },
]

const STYLE_PRESETS = [
  { name: "智能适配", caption: "由模板判断", color: "linear-gradient(135deg,#f8fafc,#e2e8f0)", prompt: "" },
  { name: "高级黑金", caption: "奢华/礼盒", color: "linear-gradient(135deg,#0f172a,#f59e0b)", prompt: "高级黑金色系，强质感，低调奢华，适合高客单价商业海报。" },
  { name: "清透蓝白", caption: "科技/服务", color: "linear-gradient(135deg,#e0f2fe,#0284c7)", prompt: "清透蓝白色系，干净科技感，信任感强，留白明确。" },
  { name: "暖橙转化", caption: "促销/电商", color: "linear-gradient(135deg,#fed7aa,#ef4444)", prompt: "暖橙促销色系，视觉热度高，行动感强，适合转化场景。" },
  { name: "自然绿调", caption: "食品/健康", color: "linear-gradient(135deg,#dcfce7,#16a34a)", prompt: "自然绿色系，健康、新鲜、可信赖，生活方式摄影感。" },
]

const BRAND_TAGS = ["品牌主色", "Logo 安全区", "卖点词库", "合规避坑", "批量尺寸"]

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
  const selectedRatio = RATIO_META[size]
  const selectedTemplate = TEMPLATE_PACKS.find((item) => item.title === title)
  const readinessChecks = [
    { label: "选择业务场景", ok: Boolean(type) },
    { label: "填写生成需求", ok: Boolean(title.trim() || detail.trim()) },
    { label: "设置输出尺寸", ok: Boolean(size) },
    { label: "确定品牌风格", ok: stylePreset.name !== "智能适配" || Boolean(customPrompt.trim()) },
  ]
  const readyScore = readinessChecks.filter((item) => item.ok).length
  const quotaBlocked = totalQuota < count

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
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900 bg-slate-950 p-4 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(217,249,157,0.28),transparent_30%),radial-gradient(circle_at_84%_10%,rgba(249,115,22,0.2),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-lime-300 text-slate-950 hover:bg-lime-300">Production Console</Badge>
              <Badge variant="outline" className="rounded-full border-white/15 bg-white/8 text-white">{selectedIndustry?.label}</Badge>
              <Badge variant="outline" className="rounded-full border-white/15 bg-white/8 text-white">{selectedRatio.use}</Badge>
              {detected && detected !== type ? (
                <Badge className="rounded-full bg-amber-300 text-slate-950 hover:bg-amber-300">
                  智能建议：{IMAGE_TYPES.find((item) => item.value === detected)?.label}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-6xl">
              一张商业图，从需求到可投放资产
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
              按真实生产流程组织：选场景、写需求、定尺寸、控风格、看结果。用户不需要理解 prompt 工程，也能稳定产出电商图、海报、封面和 Banner。
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              {readinessChecks.map((item, index) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-white/42">0{index + 1}</span>
                    <span className={cn("grid size-6 place-items-center rounded-full", item.ok ? "bg-lime-300 text-slate-950" : "bg-white/10 text-white/40")}>{item.ok ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={CircleDollarSign} label="可用额度" value={`${totalQuota}`} />
              <Metric icon={Layers3} label="配置完成" value={`${readyScore}/4`} />
            </div>
            <Button className="mt-4 h-13 w-full rounded-2xl bg-lime-300 text-base font-semibold text-slate-950 hover:bg-lime-200" onClick={handleGenerate} disabled={loading || quotaBlocked}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              {quotaBlocked ? "额度不足" : `生成 ${count} 张商业图`}
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-white/45">
              生成后自动进入项目历史，结果支持预览、下载和换一批。
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="min-w-0 space-y-4">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle eyebrow="Step 1" title="选择一个生产起点" desc="模板只负责给用户起步，后面仍然可以自由改需求、尺寸和风格。" />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {TEMPLATE_PACKS.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => handleTemplate(item)}
                  className={cn(
                    "group overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
                    title === item.title ? "border-slate-950 ring-4 ring-slate-950/5" : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <div className={cn("relative h-28 overflow-hidden bg-gradient-to-br p-4", item.accent)}>
                    <div className="absolute -right-8 -top-8 size-24 rounded-full bg-white/45 blur-sm" />
                    <Badge className="relative rounded-full bg-white/80 text-slate-700 hover:bg-white/80">{item.scene}</Badge>
                    <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.preview}</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">{item.name}</h3>
                      <ArrowUpRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-950" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <SectionTitle eyebrow="Step 2" title="填写本次任务 brief" desc="主题负责文件名和资产识别，详细需求负责画面内容。" />
              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <Field label="素材主题">
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：夏季防晒新品上市海报" className="h-12 rounded-2xl bg-slate-50" />
                </Field>
                <Field label="生成数量">
                  <div className="grid h-12 grid-cols-4 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    {[1, 2, 3, 4].map((item) => (
                      <button key={item} type="button" onClick={() => setCount(item)} className={cn("rounded-xl text-sm transition", count === item ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-950")}>{item}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="详细需求" className="mt-4">
                <Textarea
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  placeholder="描述产品、目标人群、卖点、画面氛围、是否需要留出标题区域……"
                  className="min-h-36 resize-none rounded-3xl bg-slate-50 p-4 leading-7"
                />
              </Field>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[#f8f4ea] p-4 shadow-sm">
              <p className="text-sm font-semibold">当前任务摘要</p>
              <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">{selectedTemplate?.scene || "Custom Task"}</p>
                <p className="mt-3 text-xl font-semibold leading-tight">{title || "未填写主题"}</p>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/50">{detail || "填写产品、活动、人群和画面要求后，这里会变成可识别的生产任务。"}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <StatusPill label="类型" value={selectedType?.label || "未选"} />
                <StatusPill label="尺寸" value={size} />
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle eyebrow="Step 3" title="设置内容类型、行业和尺寸" desc="让系统知道这张图最终要被投放在哪里，而不是只生成一张好看的图。" />
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ControlBlock title="内容类型" icon={Wand2}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {IMAGE_TYPES.map((item) => {
                    const Icon = TYPE_ICONS[item.value]
                    return (
                      <button key={item.value} type="button" onClick={() => setType(item.value)} className={cn("rounded-2xl border p-3 text-left transition", type === item.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:border-slate-300")}> 
                        <Icon className="size-4" />
                        <p className="mt-2 text-sm font-semibold">{item.label}</p>
                        <p className={cn("mt-1 text-xs", type === item.value ? "text-white/55" : "text-slate-500")}>{item.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </ControlBlock>

              <ControlBlock title="行业分类" icon={BadgeCheck}>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((item) => (
                    <button key={item.value} type="button" onClick={() => setIndustry(item.value)} className={cn("rounded-full border px-3 py-2 text-sm transition", industry === item.value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>{item.label}</button>
                  ))}
                </div>
              </ControlBlock>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {RATIOS.map((item) => (
                <button key={item.value} type="button" onClick={() => setSize(item.value)} className={cn("rounded-3xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md", size === item.value ? "border-slate-950 ring-4 ring-slate-950/5" : "border-slate-200 hover:border-slate-300")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("grid w-16 place-items-center rounded-2xl bg-slate-100", item.value === "16:9" ? "h-10" : "h-14", RATIO_META[item.value].frame)}>
                      <span className="text-[10px] font-semibold text-slate-400">{item.value}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{RATIO_META[item.value].label}</p>
                      <p className="mt-1 text-xs text-slate-500">{RATIO_META[item.value].hint}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <SectionTitle eyebrow="Step 4" title="品牌风格" />
                <Palette className="size-4 text-slate-400" />
              </div>
              <div className="mt-4 space-y-2">
                {STYLE_PRESETS.map((item) => (
                  <button key={item.name} type="button" onClick={() => setStylePreset(item)} className={cn("flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition", stylePreset.name === item.name ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300")}> 
                    <span className="size-9 rounded-xl border border-white shadow-sm" style={{ background: item.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.name}</span>
                      <span className="block text-xs text-slate-500">{item.caption}</span>
                    </span>
                    {stylePreset.name === item.name ? <Check className="size-4" /> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTitle eyebrow="Prompt Layer" title="自定义提示词 / 反推风格" desc="同款参考、镜头、材质、色彩会和系统模板自动合并。" />
                <Badge variant="outline" className="rounded-full bg-white">{customPrompt.length}/{CUSTOM_PROMPT_MAX}</Badge>
              </div>
              <Textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value.slice(0, CUSTOM_PROMPT_MAX))}
                placeholder="例如：高端护肤品牌质感，柔和棚拍光，玻璃材质反射，奶油白背景，产品周围有水滴和植物元素。"
                className="mt-4 min-h-28 resize-none rounded-3xl bg-slate-50 p-4 leading-7"
              />
              <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">最终提示词预览</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(finalPrompt)
                      toast.success("已复制提示词")
                    }}
                  >
                    <Copy className="size-4" />
                    复制
                  </Button>
                </div>
                <p className="mt-3 line-clamp-[6] text-sm leading-7 text-white/58">{finalPrompt}</p>
              </div>
            </div>
          </section>
        </main>

        <aside className="min-w-0 space-y-4 2xl:sticky 2xl:top-24 2xl:self-start">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">生成结果台</p>
                <p className="mt-1 text-xs text-slate-500">生成、预览、下载和换一批都在这里完成。</p>
              </div>
              {loading ? <Badge className="rounded-full bg-lime-200 text-slate-950 hover:bg-lime-200"><Loader2 className="size-3 animate-spin" /> 正在生成</Badge> : null}
            </div>
            {currentJob ? (
              <ResultCards job={currentJob} loading={loading} onReroll={handleReroll} />
            ) : (
              <div className="grid min-h-[22rem] place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div>
                  <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-white shadow-sm">
                    <Sparkles className="size-7 text-slate-500" />
                  </div>
                  <p className="mt-4 font-semibold">等待第一组素材</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">选择模板并填写 brief 后，点击顶部按钮生成真实图片。</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">品牌一致性</p>
                <p className="mt-1 text-xs text-slate-500">未来接后台品牌资产</p>
              </div>
              <ShieldCheck className="size-5 text-emerald-500" />
            </div>
            <div className="mt-4 flex gap-2">
              {["#111827", "#d9f99d", "#f97316", "#0ea5e9"].map((color) => (
                <span key={color} className="size-10 rounded-2xl border border-slate-200 shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {BRAND_TAGS.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">{tag}</span>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold">投放检查</p>
            <div className="mt-4 space-y-3">
              {readinessChecks.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <span className={cn("grid size-6 place-items-center rounded-full", item.ok ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>{item.ok ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}</span>
                  <span className={item.ok ? "text-slate-700" : "text-slate-400"}>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-[#d9f99d] p-4 text-slate-950 shadow-sm">
            <div className="flex items-start gap-3">
              <Ticket className="mt-0.5 size-5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">邀请码 / 试用额度</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">用于增长裂变，后续可迁入管理后台配置。</p>
              </div>
              {appliedCode ? <Badge className="rounded-full bg-white text-emerald-700 hover:bg-white">已绑定</Badge> : null}
            </div>
            <div className="mt-4 flex gap-2">
              <Input value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="输入邀请码" className="h-11 rounded-full border-slate-950/10 bg-white" />
              <Button variant="outline" className="h-11 rounded-full border-slate-950/20 bg-white" onClick={handleApplyCode}>兑换</Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <Icon className="size-4 text-lime-200" />
      <p className="mt-2 text-xs text-white/45">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
      {desc ? <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p> : null}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function ControlBlock({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-white shadow-sm">
          <Icon className="size-4 text-slate-600" />
        </span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {children}
    </div>
  )
}
