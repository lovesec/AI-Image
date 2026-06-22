"use client"

import { useState } from "react"
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileImage,
  History,
  ImageIcon,
  LayoutTemplate,
  LockKeyhole,
  Mail,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type AuthMode = "register" | "login"
type IdentityType = "phone" | "email"
type LandingTab = "home" | "cases"

const productPillars = [
  { icon: LayoutTemplate, title: "模板化生产", desc: "电商、海报、社媒、Banner 按场景组织，不从空白 prompt 开始。" },
  { icon: Palette, title: "品牌一致性", desc: "品牌色、风格词、禁用词、同款参考会自动进入生成链路。" },
  { icon: History, title: "素材资产化", desc: "生成记录可回溯、可再生成、可导出，适合团队持续运营。" },
]

const caseTabs = ["全部", "运营", "APP", "海报", "插画", "IP", "信息图", "电商", "品牌"]

const caseCards = [
  {
    type: "信息图",
    title: "龙井茶信息图海报",
    meta: "4:5 / 产品摄影 / 功能卡片 / 冲泡指南",
    source: "YouMind 灵感",
    format: "教育视觉图",
    prompt: "精致中国茶信息图海报，顶部产品摄影，中段展示产地、香气、等级和功效卡片，底部用 3 步冲泡指南说明水温、茶量和时间，米白宣纸质感，龙井绿与墨色排版，高级留白。",
    tone: "from-lime-100 via-stone-50 to-emerald-100",
  },
  {
    type: "运营",
    title: "会员日福利长图",
    meta: "9:16 / 福利分层 / 行动按钮 / 私域转化",
    source: "Image2Hub 分类",
    format: "运营物料",
    prompt: "品牌会员日运营长图，首屏大标题，三档福利权益卡片，倒计时模块和行动按钮，暖橙促销氛围，清晰分区，适合社群和朋友圈转发。",
    tone: "from-orange-100 via-white to-amber-100",
  },
  {
    type: "APP",
    title: "AI 修图 App 首屏",
    meta: "16:9 / 产品界面 / 功能卖点 / 科技感",
    source: "Image2Hub 分类",
    format: "APP 宣传图",
    prompt: "AI 图片编辑 App 官网首屏，左侧大标题和三条功能卖点，右侧手机界面展示一键抠图、扩图和海报生成，清透蓝白科技感，柔和玻璃拟态。",
    tone: "from-sky-100 via-white to-cyan-100",
  },
  {
    type: "海报",
    title: "新品发布倒计时海报",
    meta: "4:5 / 强标题 / 产品悬浮 / 发布氛围",
    source: "商业海报模板",
    format: "活动海报",
    prompt: "新品发布倒计时海报，中心产品悬浮，背景有速度光轨和细腻颗粒，顶部大标题，底部保留日期和预约按钮区域，高级黑金配色。",
    tone: "from-slate-200 via-stone-50 to-orange-100",
  },
  {
    type: "插画",
    title: "城市通勤生活方式插画",
    meta: "1:1 / 扁平插画 / 社媒封面 / 年轻感",
    source: "Image2Hub 分类",
    format: "插画封面",
    prompt: "年轻白领城市通勤生活方式插画，清晨地铁、咖啡和笔记本元素，柔和几何构图，低饱和蓝绿配色，适合公众号和小红书封面。",
    tone: "from-teal-100 via-white to-sky-100",
  },
  {
    type: "IP",
    title: "品牌吉祥物三视图",
    meta: "1:1 / IP 设定 / 可爱形象 / 延展素材",
    source: "Image2Hub 分类",
    format: "IP 形象",
    prompt: "面向 AI 图片工具的品牌吉祥物三视图，可爱的像素相机小助手，正面、侧面和表情变化，配品牌色贴纸元素，干净白底，适合后续做运营贴图。",
    tone: "from-yellow-100 via-white to-lime-100",
  },
  {
    type: "电商",
    title: "护肤新品主图",
    meta: "4:5 / 商品居中 / 卖点留白 / 质感棚拍",
    source: "电商转化场景",
    format: "商品主图",
    prompt: "清爽防晒新品电商主图，透明瓶身，奶油白背景，水滴和户外自然光，产品居中，右侧预留功效标签和价格信息区域，高级干净。",
    tone: "from-orange-100 via-white to-lime-100",
  },
  {
    type: "电商",
    title: "食品详情页首屏",
    meta: "4:5 / 食欲感 / 价格标签 / 直播间可用",
    source: "电商详情页场景",
    format: "详情页首屏",
    prompt: "手作曲奇礼盒详情页首屏，暖光棚拍，礼盒打开露出多种口味，桌面有麦穗和牛奶，预留直播间价格标签与购买按钮。",
    tone: "from-amber-100 via-white to-orange-100",
  },
  {
    type: "品牌",
    title: "SaaS 官网 Hero Banner",
    meta: "16:9 / 左文案右视觉 / 产品界面",
    source: "品牌官网场景",
    format: "官网 Banner",
    prompt: "SaaS 产品官网首屏 Banner，深色设备界面，右侧产品视觉和数据卡片，左侧保留标题与 CTA，蓝白科技质感，商业级光影。",
    tone: "from-slate-100 via-white to-cyan-100",
  },
  {
    type: "品牌",
    title: "同款风格复刻",
    meta: "参考图 / 反推 prompt / 再生成 / 品牌统一",
    source: "产品独立功能",
    format: "同款参考",
    prompt: "上传参考图后提取配色、构图、材质、光线和镜头语言，生成同风格商业素材，保持品牌一致性并自动规避水印和侵权元素。",
    tone: "from-violet-100 via-white to-lime-100",
  },
]

const creatorScenes = [
  { name: "电商主图", ratio: "4:5", hint: "产品居中、卖点留白、适合信息流投放", tone: "from-orange-100 via-white to-lime-100" },
  { name: "活动海报", ratio: "9:16", hint: "强标题、福利区、扫码区、行动按钮", tone: "from-rose-100 via-white to-orange-100" },
  { name: "社媒封面", ratio: "1:1", hint: "大标题、强对比、手机端浏览友好", tone: "from-pink-100 via-white to-sky-100" },
  { name: "品牌 Banner", ratio: "16:9", hint: "左文案右视觉、官网和广告位可用", tone: "from-slate-100 via-white to-cyan-100" },
]

const creatorStyles = ["智能适配", "高级黑金", "清透蓝白", "暖橙转化", "自然绿调"]

export function LoginScreen() {
  const { login, register, sendVerificationCode } = useStore()
  const [landingTab, setLandingTab] = useState<LandingTab>("home")
  const [caseFilter, setCaseFilter] = useState("全部")
  const [authOpen, setAuthOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>("register")
  const [identityType, setIdentityType] = useState<IdentityType>("phone")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [sent, setSent] = useState(false)

  const identity = identityType === "phone" ? phone.trim() : email.trim()
  const isPhone = identityType === "phone"
  const visibleCases = caseFilter === "全部" ? caseCards : caseCards.filter((item) => item.type === caseFilter)

  const openAuth = (nextMode: AuthMode = "register") => {
    setMode(nextMode)
    setAuthOpen(true)
  }

  const validateIdentity = () => {
    if (isPhone && !/^1\d{10}$/.test(phone)) {
      toast.error("请输入有效的手机号")
      return false
    }
    if (!isPhone && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("请输入有效的邮箱")
      return false
    }
    return true
  }

  const sendCode = () => {
    if (!validateIdentity()) return
    void (async () => {
      const result = await sendVerificationCode(identity)
      if (result.ok) {
        setSent(true)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })()
  }

  const submitAuth = () => {
    if (!validateIdentity()) return
    if (mode === "register" && password.length < 6) {
      toast.error("请设置至少 6 位密码")
      return
    }
    if (mode === "login" && password && password.length < 6) {
      toast.error("密码至少 6 位")
      return
    }
    if ((mode === "register" || !password) && code.length < 4) {
      toast.error("请输入验证码")
      return
    }

    void (async () => {
      const result =
        mode === "register"
          ? await register({ identity, password, code, inviteCode })
          : await login({ identity, password: password || undefined, code })
      if (result.ok) {
        toast.success(mode === "register" ? "注册成功，正在进入工作台" : result.message)
      } else {
        toast.error(result.message)
      }
    })()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4efe4] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(217,249,157,0.86),transparent_26%),radial-gradient(circle_at_88%_8%,rgba(251,146,60,0.24),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.82),rgba(241,245,249,0.35))]" />
      <div className="pointer-events-none absolute left-1/2 top-12 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full border border-slate-950/5" />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40 rounded-full border border-white/70 bg-white/72 px-4 py-3 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="font-semibold leading-none">智图 Studio</p>
                <p className="mt-1 hidden text-xs text-slate-500 sm:block">AI 商业视觉生产台</p>
              </div>
            </div>

            <div className="hidden rounded-full bg-slate-100 p-1 lg:grid lg:grid-cols-2">
              <button type="button" onClick={() => setLandingTab("home")} className={cn("rounded-full px-5 py-2 text-sm transition", landingTab === "home" ? "bg-white font-medium shadow-sm" : "text-slate-500")}>首页</button>
              <button type="button" onClick={() => setLandingTab("cases")} className={cn("rounded-full px-5 py-2 text-sm transition", landingTab === "cases" ? "bg-white font-medium shadow-sm" : "text-slate-500")}>案例</button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-full" onClick={() => openAuth("login")}>登录</Button>
              <Button className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800" onClick={() => openAuth("register")}>
                免费开始
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="mt-4 grid rounded-full bg-white/68 p-1 shadow-sm lg:hidden">
          <div className="grid grid-cols-2">
            <button type="button" onClick={() => setLandingTab("home")} className={cn("rounded-full px-4 py-2 text-sm", landingTab === "home" ? "bg-slate-950 text-white" : "text-slate-500")}>首页</button>
            <button type="button" onClick={() => setLandingTab("cases")} className={cn("rounded-full px-4 py-2 text-sm", landingTab === "cases" ? "bg-slate-950 text-white" : "text-slate-500")}>案例</button>
          </div>
        </div>

        {landingTab === "home" ? (
          <HomeTab onShowCases={() => setLandingTab("cases")} onAuth={() => openAuth("register")} />
        ) : (
          <CasesTab caseFilter={caseFilter} setCaseFilter={setCaseFilter} visibleCases={visibleCases} onAuth={() => openAuth("register")} />
        )}
      </div>

      {authOpen ? (
        <AuthModal
          mode={mode}
          setMode={setMode}
          identityType={identityType}
          setIdentityType={setIdentityType}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          code={code}
          setCode={setCode}
          password={password}
          setPassword={setPassword}
          inviteCode={inviteCode}
          setInviteCode={setInviteCode}
          sent={sent}
          sendCode={sendCode}
          submitAuth={submitAuth}
          isPhone={isPhone}
          onClose={() => setAuthOpen(false)}
        />
      ) : null}
    </main>
  )
}

function HomeTab({ onShowCases, onAuth }: { onShowCases: () => void; onAuth: () => void }) {
  const [scene, setScene] = useState(creatorScenes[0])
  const [style, setStyle] = useState(creatorStyles[0])
  const [prompt, setPrompt] = useState("夏季防晒新品上市，突出清爽、防水、户外通勤场景，画面高级干净。")

  return (
    <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(620px,1fr)] lg:py-16">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/74 px-3 py-2 text-sm text-slate-600 shadow-sm">
          <BadgeCheck className="size-4 text-lime-600" />
          先体验交互，再注册生成真实图片
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-7xl">
          像真正工作台一样生成商业图片
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          首页直接给用户看到成熟的生成流程：选择场景、填写需求、控制尺寸和风格、预览系统 prompt。只有点击正式生成、保存项目或导出高清时才需要登录。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800" onClick={onAuth}>
            登录后生成
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" className="h-12 rounded-full bg-white/70 px-6" onClick={onShowCases}>查看案例</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 shadow-[0_34px_120px_rgba(15,23,42,0.13)] backdrop-blur-xl">
        <div className="border-b border-slate-200/80 bg-white/70 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Public Creator</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">公开版生成工作台</h2>
            </div>
            <div className="rounded-full bg-lime-200 px-3 py-1.5 text-xs font-medium text-slate-950">登录后生成高清图</div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Label>选择生成场景</Label>
                <button type="button" onClick={onShowCases} className="text-xs font-medium text-slate-500 hover:text-slate-950">
                  看更多案例
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {creatorScenes.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setScene(item)}
                    className={cn(
                      "rounded-3xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                      scene.name === item.name ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("grid size-12 place-items-center rounded-2xl bg-gradient-to-br", item.tone)}>
                        <ImageIcon className="size-5 text-slate-500" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{item.name}</span>
                        <span className="mt-1 block text-xs text-slate-500">{item.ratio} · {item.hint}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>你的需求</Label>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="描述产品、活动、目标人群、画面风格……"
                className="min-h-28 resize-none rounded-3xl bg-white p-4 leading-7"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_210px]">
              <div className="space-y-2">
                <Label>品牌风格</Label>
                <div className="flex flex-wrap gap-2">
                  {creatorStyles.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setStyle(item)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-sm transition",
                        style === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">输出规格</p>
                <p className="mt-2 text-2xl font-semibold">{scene.ratio}</p>
                <p className="mt-1 text-xs text-slate-500">{scene.name} 推荐尺寸</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">系统提示词预览</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {scene.name}，{scene.hint}，{style}风格，用户需求：{prompt || "等待输入"}。自动加入品牌一致性、安全反向提示词和投放尺寸控制。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="h-12 flex-1 rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={onAuth}>
                生成真实图片
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl bg-white" onClick={onAuth}>保存项目</Button>
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-950 p-5 text-white xl:border-l xl:border-t-0 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">输出预览</p>
                <p className="mt-1 text-xs text-white/45">公开预览，不消耗额度</p>
              </div>
              <Zap className="size-5 text-lime-200" />
            </div>

            <div className={cn("mt-5 grid aspect-[4/5] place-items-center rounded-[1.75rem] bg-gradient-to-br p-5 text-slate-950", scene.tone)}>
              <div className="rounded-3xl bg-white/78 p-5 text-center shadow-sm backdrop-blur">
                <FileImage className="mx-auto size-10 text-slate-500" />
                <p className="mt-4 font-semibold">{scene.name}</p>
                <p className="mt-1 text-xs text-slate-500">{scene.ratio} · {style}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {["生成高清图", "批量出 4 张", "导出 PNG", "保存历史"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl bg-white/[0.07] px-3 py-3 text-sm text-white/70 ring-1 ring-white/10">
                  <span>{item}</span>
                  <LockKeyhole className="size-3.5 text-white/38" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <div className="lg:col-span-2 grid gap-3 md:grid-cols-3">
        {productPillars.map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-200 bg-white/78 p-4 shadow-sm">
            <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-white">
              <item.icon className="size-5" />
            </span>
            <p className="mt-4 font-semibold">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CasesTab({
  caseFilter,
  setCaseFilter,
  visibleCases,
  onAuth,
}: {
  caseFilter: string
  setCaseFilter: (value: string) => void
  visibleCases: typeof caseCards
  onAuth: () => void
}) {
  const featured = visibleCases[0] ?? caseCards[0]
  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success("提示词已复制")
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  return (
    <section className="py-10 lg:py-14">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-slate-950 text-white shadow-[0_34px_120px_rgba(15,23,42,0.18)]">
          <div className="relative min-h-[25rem] p-5 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(217,249,157,0.28),transparent_30%),radial-gradient(circle_at_84%_8%,rgba(251,146,60,0.2),transparent_26%)]" />
            <div className="relative max-w-3xl">
              <p className="text-sm font-medium text-lime-200">AI Prompt Gallery</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
                可以复制提示词，也可以一键生成同款
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58">
                参考 YouMind 的单案例详情结构和 Image2Hub 的多分类灵感库结构，沉淀成你自己的商业案例库。用户先看到能力边界，再注册生成真实图片。
              </p>
            </div>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "案例数量", value: `${caseCards.length}` },
                { label: "分类覆盖", value: `${caseTabs.length - 1}` },
                { label: "可复制 Prompt", value: "100%" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <p className="text-xs text-white/42">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[2.2rem] border border-slate-200 bg-white/82 p-5 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold">本周精选</p>
          <div className={cn("mt-4 aspect-[4/5] rounded-[1.75rem] bg-gradient-to-br p-5", featured.tone)}>
            <div className="flex h-full flex-col justify-between">
              <span className="w-fit rounded-full bg-white/82 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">{featured.type}</span>
              <div className="rounded-3xl bg-white/82 p-4 shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{featured.format}</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight">{featured.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{featured.meta}</p>
              </div>
            </div>
          </div>
          <Button className="mt-4 h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={onAuth}>
            用精选案例生成同款
            <ArrowRight className="size-4" />
          </Button>
        </aside>
      </div>

      <div className="sticky top-24 z-20 mt-5 rounded-[1.5rem] border border-white/70 bg-white/74 p-2 shadow-sm backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {caseTabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCaseFilter(item)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm shadow-sm transition hover:-translate-y-0.5",
                caseFilter === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white/72 text-slate-600 hover:bg-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {visibleCases.map((item) => (
          <article key={item.title} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white/86 p-4 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
            <div className={cn("relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-gradient-to-br", item.tone)}>
              <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/48 blur-sm" />
              <div className="relative flex h-full flex-col justify-between p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-fit rounded-full bg-white/82 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">{item.type}</span>
                  <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs text-white">{item.format}</span>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 shadow-sm backdrop-blur">
                  <FileImage className="size-5 text-slate-500" />
                  <p className="mt-2 text-sm font-semibold">{item.title}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">{item.source}</p>
                  <h2 className="mt-1 font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                </div>
                <ChevronRight className="mt-5 size-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950" />
              </div>
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Prompt</p>
                <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{item.prompt}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-2xl bg-white" onClick={() => copyPrompt(item.prompt)}>
                  <Copy className="size-4" />
                  复制提示词
                </Button>
                <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={onAuth}>生成同款</Button>
              </div>
              <Button variant="ghost" className="mt-2 w-full rounded-2xl text-slate-500 hover:text-slate-950" onClick={onAuth}>
                <Download className="size-4" />
                登录后导出高清案例图
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AuthModal({
  mode,
  setMode,
  identityType,
  setIdentityType,
  phone,
  setPhone,
  email,
  setEmail,
  code,
  setCode,
  password,
  setPassword,
  inviteCode,
  setInviteCode,
  sent,
  sendCode,
  submitAuth,
  isPhone,
  onClose,
}: {
  mode: AuthMode
  setMode: (mode: AuthMode) => void
  identityType: IdentityType
  setIdentityType: (type: IdentityType) => void
  phone: string
  setPhone: (value: string) => void
  email: string
  setEmail: (value: string) => void
  code: string
  setCode: (value: string) => void
  password: string
  setPassword: (value: string) => void
  inviteCode: string
  setInviteCode: (value: string) => void
  sent: boolean
  sendCode: () => void
  submitAuth: () => void
  isPhone: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-[940px] overflow-hidden rounded-[2rem] border border-white/80 bg-[#f8f5ee] shadow-[0_34px_120px_rgba(15,23,42,0.28)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_430px]">
          <section className="hidden bg-slate-950 p-8 text-white lg:block">
            <Button variant="ghost" className="mb-8 rounded-full text-white/60 hover:bg-white/10 hover:text-white" onClick={onClose}>
              <X className="size-4" />
              继续看案例
            </Button>
            <p className="text-sm text-lime-200">{mode === "register" ? "Create account" : "Welcome back"}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              {mode === "register" ? "注册后即可生成真实图片并保存项目" : "登录后继续管理你的商业素材"}
            </h2>
            <div className="mt-8 space-y-3">
              {["生成真实图片", "保存历史项目", "导出高清素材", "使用反推同款"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
                  <span className="grid size-8 place-items-center rounded-full bg-lime-300 text-slate-950">
                    <BadgeCheck className="size-4" />
                  </span>
                  <span className="text-sm text-white/72">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="p-5 sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{mode === "register" ? "新用户注册" : "已有账号登录"}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">{mode === "register" ? "创建工作台账号" : "登录工作台"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {mode === "register" ? "注册后即可生成真实图片并保存项目，同时获得试用额度。" : "使用手机号或邮箱继续进入你的素材工作台。"}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="size-5" />
              </Button>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-full bg-slate-100 p-1">
              <button type="button" onClick={() => setMode("register")} className={cn("rounded-full px-4 py-2 text-sm transition", mode === "register" ? "bg-white font-medium shadow-sm" : "text-slate-500")}>注册</button>
              <button type="button" onClick={() => setMode("login")} className={cn("rounded-full px-4 py-2 text-sm transition", mode === "login" ? "bg-white font-medium shadow-sm" : "text-slate-500")}>登录</button>
            </div>

            <Tabs value={identityType} onValueChange={(value) => setIdentityType(value as IdentityType)}>
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-white p-1 shadow-sm">
                <TabsTrigger value="phone" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <Phone className="mr-1.5 size-4" />
                  手机号
                </TabsTrigger>
                <TabsTrigger value="email" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <Mail className="mr-1.5 size-4" />
                  邮箱
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identity">{isPhone ? "手机号" : "邮箱地址"}</Label>
                <Input
                  id="identity"
                  inputMode={isPhone ? "numeric" : "email"}
                  type={isPhone ? "text" : "email"}
                  placeholder={isPhone ? "请输入手机号" : "you@example.com"}
                  value={isPhone ? phone : email}
                  onChange={(event) => (isPhone ? setPhone(event.target.value) : setEmail(event.target.value))}
                  className="h-12 rounded-2xl bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{mode === "register" ? "设置密码" : "登录密码（可选）"}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === "register" ? "至少 6 位密码" : "填写密码可直接登录，也可用验证码登录"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl bg-white pr-11"
                  />
                  <Eye className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">验证码</Label>
                <div className="flex gap-2">
                  <Input id="code" inputMode="numeric" placeholder="输入 4 位验证码" value={code} onChange={(event) => setCode(event.target.value)} className="h-12 rounded-2xl bg-white" />
                  <Button variant="outline" className="h-12 shrink-0 rounded-2xl bg-white" onClick={sendCode}>{sent ? "重新发送" : "发送验证码"}</Button>
                </div>
              </div>

              {mode === "register" ? (
                <div className="space-y-2">
                  <Label htmlFor="invite">邀请码（选填）</Label>
                  <Input id="invite" placeholder="例如 WELCOME20" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} className="h-12 rounded-2xl bg-white" />
                </div>
              ) : null}

              <Button className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={submitAuth}>
                {mode === "register" ? "注册并进入工作台" : "登录并进入工作台"}
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <p className="text-sm font-semibold">注册前可看案例，注册后可生成和保存。</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                登录即代表同意《用户协议》与《隐私政策》。原型仅作演示，请勿输入真实敏感信息。
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
