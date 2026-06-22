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
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wand2,
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

const RATIO_META: Record<AspectRatio, { label: string; use: string; frame: string }> = {
  "1:1": { label: "1:1", use: "社媒方图", frame: "aspect-square" },
  "4:5": { label: "4:5", use: "电商/信息流", frame: "aspect-[4/5]" },
  "16:9": { label: "16:9", use: "Banner", frame: "aspect-video" },
  "9:16": { label: "9:16", use: "短视频竖屏", frame: "aspect-[9/16]" },
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
}[] = [
  {
    name: "爆款商品首图",
    scene: "电商转化",
    title: "新品上市电商详情页首屏",
    detail: "产品居中展示，突出材质、卖点和使用场景，背景简洁高级，预留价格和卖点标签区域。",
    type: "product_shot",
    industry: "ecommerce",
    size: "4:5",
    accent: "from-orange-200 via-white to-lime-100",
  },
  {
    name: "私域活动海报",
    scene: "促销裂变",
    title: "618 限时促销活动海报",
    detail: "强视觉主标题，促销氛围明确，包含利益点、倒计时区域和行动按钮留白。",
    type: "poster",
    industry: "ecommerce",
    size: "4:5",
    accent: "from-rose-100 via-white to-orange-100",
  },
  {
    name: "课程招生封面",
    scene: "知识付费",
    title: "训练营招生课程封面",
    detail: "专业可信赖，标题醒目，包含讲师、课程收益和报名引导的视觉空间。",
    type: "cover",
    industry: "education",
    size: "1:1",
    accent: "from-sky-100 via-white to-slate-100",
  },
  {
    name: "官网 Hero Banner",
    scene: "品牌官网",
    title: "春季品牌活动 Banner",
    detail: "横向构图，左侧文字区，右侧产品或人物主视觉，高级商业质感。",
    type: "banner",
    industry: "it",
    size: "16:9",
    accent: "from-slate-200 via-white to-cyan-100",
  },
]

const STYLE_PRESETS = [
  { name: "智能适配", caption: "由模板判断", color: "linear-gradient(135deg,#f8fafc,#e2e8f0)", prompt: "" },
  { name: "高级黑金", caption: "奢华/礼盒", color: "linear-gradient(135deg,#0f172a,#f59e0b)", prompt: "高级黑金色系，强质感，低调奢华，适合高客单价商业海报。" },
  { name: "清透蓝白", caption: "科技/服务", color: "linear-gradient(135deg,#e0f2fe,#0284c7)", prompt: "清透蓝白色系，干净科技感，信任感强，留白明确。" },
  { name: "暖橙转化", caption: "促销/电商", color: "linear-gradient(135deg,#fed7aa,#ef4444)", prompt: "暖橙促销色系，视觉热度高，行动感强，适合转化场景。" },
  { name: "自然绿调", caption: "食品/健康", color: "linear-gradient(135deg,#dcfce7,#16a34a)", prompt: "自然绿色系，健康、新鲜、可信赖，生活方式摄影感。" },
]

const WORKFLOW_STEPS = ["选场景", "写需求", "控品牌", "出资产"]
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
  const readyScore = [type, industry, size, title.trim() || detail.trim(), stylePreset.name !== "智能适配" || customPrompt.trim()].filter(Boolean).length
  const selectedRatio = RATIO_META[size]

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
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[#f7f4ec] shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(217,249,157,0.75),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(251,146,60,0.2),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.88),rgba(248,250,252,0.28))]" />
      <div className="relative grid min-h-[calc(100vh-8rem)] lg:grid-cols-[260px_minmax(0,1fr)_330px]">
        <aside className="border-b border-slate-200/80 bg-white/45 p-4 backdrop-blur-xl lg:border-b-0 lg:border-r">
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <Badge className="rounded-full bg-lime-300 text-slate-950 hover:bg-lime-300">AI Commercial Studio</Badge>
            <h1 className="mt-5 text-2xl font-semibold leading-tight">商业图片生成工作台</h1>
            <p className="mt-3 text-sm leading-6 text-white/58">围绕模板、品牌和投放尺寸组织生成，而不是把用户丢给空白 prompt。</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Metric icon={CircleDollarSign} label="额度" value={`${totalQuota}`} />
              <Metric icon={Layers3} label="完成度" value={`${readyScore}/5`} />
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white/72 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Workflow</p>
            <div className="mt-4 space-y-3">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <span className={cn("grid size-8 place-items-center rounded-full text-xs font-semibold", index < readyScore - 1 ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-400")}>{index + 1}</span>
                  <span className="text-sm text-slate-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white/72 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">邀请码</p>
                <p className="mt-1 text-xs text-slate-500">用于试用额度和增长裂变</p>
              </div>
              {appliedCode ? <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">已绑定</Badge> : null}
            </div>
            <div className="mt-4 flex gap-2">
              <Input value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="输入邀请码" className="rounded-full bg-white" />
              <Button variant="outline" className="rounded-full" onClick={handleApplyCode}>兑换</Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-5 xl:p-6">
          <section className="rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full bg-white">{selectedIndustry?.label}</Badge>
                  <Badge variant="outline" className="rounded-full bg-white">{selectedRatio.use}</Badge>
                  {detected && detected !== type ? <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100">检测到更像：{IMAGE_TYPES.find((item) => item.value === detected)?.label}</Badge> : null}
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">一句需求，生成一组可投放素材</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">适合电商主图、营销海报、社媒封面、官网 Banner。后续可以接后台模板配置，把每个行业 prompt 变成可运营资产。</p>
              </div>
              <Button className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800" onClick={handleGenerate} disabled={loading || totalQuota < count}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                生成 {count} 张
              </Button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {TEMPLATE_PACKS.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => handleTemplate(item)}
                  className={cn(
                    "group overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
                    title === item.title ? "border-slate-950" : "border-slate-200",
                  )}
                >
                  <div className={cn("h-24 bg-gradient-to-br p-4", item.accent)}>
                    <div className="flex items-center justify-between">
                      <Badge className="rounded-full bg-white/80 text-slate-700 hover:bg-white/80">{item.scene}</Badge>
                      <ArrowUpRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-950" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>素材主题</Label>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：夏季防晒新品上市海报" className="h-12 rounded-2xl bg-white" />
                </div>
                <div className="space-y-2">
                  <Label>生成数量</Label>
                  <div className="grid h-12 grid-cols-4 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    {[1, 2, 3, 4].map((item) => (
                      <button key={item} type="button" onClick={() => setCount(item)} className={cn("rounded-xl text-sm transition", count === item ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-950")}>{item} 张</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>详细需求</Label>
                <Textarea
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  placeholder="描述产品、目标人群、卖点、画面氛围、是否需要留出标题区域……"
                  className="min-h-36 resize-none rounded-3xl bg-white p-4 leading-7"
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">尺寸选择</p>
                  <Maximize2 className="size-4 text-slate-400" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {RATIOS.map((item) => (
                    <button key={item.value} type="button" onClick={() => setSize(item.value)} className={cn("rounded-2xl border bg-white p-3 text-left transition", size === item.value ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200 hover:border-slate-300")}>
                      <div className={cn("mb-3 grid place-items-center rounded-xl bg-slate-100", item.value === "16:9" ? "h-12" : "h-16", RATIO_META[item.value].frame)}>
                        <span className="text-xs font-semibold text-slate-400">{item.value}</span>
                      </div>
                      <p className="text-sm font-semibold">{RATIO_META[item.value].label}</p>
                      <p className="mt-1 text-xs text-slate-500">{RATIO_META[item.value].use}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">品牌风格</p>
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
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">自定义提示词 / 反推风格</p>
                  <p className="mt-1 text-xs text-slate-500">这里会和系统模板自动合并，适合放同款风格、镜头、材质、色彩。</p>
                </div>
                <Badge variant="outline" className="rounded-full bg-white">{customPrompt.length}/{CUSTOM_PROMPT_MAX}</Badge>
              </div>
              <Textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value.slice(0, CUSTOM_PROMPT_MAX))}
                placeholder="例如：高端护肤品牌质感，柔和棚拍光，玻璃材质反射，奶油白背景，产品周围有水滴和植物元素。"
                className="mt-4 min-h-28 resize-none rounded-3xl bg-white p-4 leading-7"
              />
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">生成提示词预览</p>
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
              <p className="mt-4 line-clamp-[8] text-sm leading-7 text-white/58">{finalPrompt}</p>
            </div>
          </section>

          <section className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white/85 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">生成结果</p>
                <p className="mt-1 text-xs text-slate-500">结果会进入项目历史，后续可做二次编辑和批量导出。</p>
              </div>
              {loading ? <Badge className="rounded-full bg-lime-200 text-slate-950 hover:bg-lime-200"><Loader2 className="size-3 animate-spin" /> 正在生成</Badge> : null}
            </div>
            {currentJob ? (
              <ResultCards job={currentJob} loading={loading} onReroll={handleReroll} />
            ) : (
              <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white shadow-sm">
                    <Sparkles className="size-6 text-slate-500" />
                  </div>
                  <p className="mt-4 font-semibold">还没有生成结果</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">选择一个模板，补充产品或活动信息，然后生成第一组商业素材。</p>
                </div>
              </div>
            )}
          </section>
        </main>

        <aside className="border-t border-slate-200/80 bg-white/55 p-4 backdrop-blur-xl lg:border-l lg:border-t-0">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">品牌一致性</p>
                  <p className="mt-1 text-xs text-slate-500">未来接后台品牌资产</p>
                </div>
                <ShieldCheck className="size-5 text-emerald-500" />
              </div>
              <div className="mt-4 flex gap-2">
                {['#111827', '#d9f99d', '#f97316', '#0ea5e9'].map((color) => (
                  <span key={color} className="size-10 rounded-2xl border border-slate-200 shadow-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {BRAND_TAGS.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">{tag}</span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold">投放检查</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "已选择业务场景", ok: Boolean(type) },
                  { label: "已填写生成需求", ok: Boolean(title.trim() || detail.trim()) },
                  { label: "已设置输出尺寸", ok: Boolean(size) },
                  { label: "已设置品牌风格", ok: stylePreset.name !== "智能适配" || Boolean(customPrompt.trim()) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <span className={cn("grid size-6 place-items-center rounded-full", item.ok ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>{item.ok ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}</span>
                    <span className={item.ok ? "text-slate-700" : "text-slate-400"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#d9f99d] p-4 text-slate-950 shadow-sm">
              <Ticket className="size-5" />
              <p className="mt-3 font-semibold">下一步产品化建议</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">把模板、品牌色、禁用词和行业提示词迁到管理后台，前台只负责选择和生成。</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <Icon className="size-4 text-lime-200" />
      <p className="mt-2 text-xs text-white/45">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function ControlBlock({ title, icon: Icon, children }: { title: string; icon: typeof Sparkles; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
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
