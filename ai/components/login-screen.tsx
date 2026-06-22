"use client"

import { useState } from "react"
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Download,
  Eye,
  FileImage,
  History,
  ImageIcon,
  Layers3,
  LockKeyhole,
  Mail,
  Palette,
  Phone,
  Play,
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

const publicScenes = [
  { name: "电商主图", tag: "4:5", prompt: "新品上市电商详情页首屏，产品居中，卖点标签留白", tone: "from-orange-100 via-white to-lime-100" },
  { name: "活动海报", tag: "9:16", prompt: "618 限时促销海报，强标题、福利区、扫码区", tone: "from-rose-100 via-white to-orange-100" },
  { name: "社媒封面", tag: "1:1", prompt: "小红书种草封面，醒目标题、生活方式氛围", tone: "from-pink-100 via-white to-sky-100" },
  { name: "品牌 Banner", tag: "16:9", prompt: "官网 Hero Banner，左文案右产品，高级商业质感", tone: "from-slate-100 via-white to-cyan-100" },
]

const featureCards = [
  { icon: Wand2, title: "提示词模板", desc: "用户选行业和用途，系统自动组合专业 prompt。" },
  { icon: Palette, title: "品牌一致性", desc: "品牌色、风格词、禁用词自动带入生成流程。" },
  { icon: History, title: "资产回溯", desc: "保存生成参数和图片，支持换一批、再生成、下载。" },
]

const sampleResults = [
  { title: "春季新品首图", meta: "电商零售 / 4:5", tone: "from-[#f97316]/25 via-white to-[#d9f99d]" },
  { title: "私域裂变海报", meta: "活动促销 / 9:16", tone: "from-[#fb7185]/25 via-white to-[#fed7aa]" },
  { title: "官网活动横幅", meta: "品牌官网 / 16:9", tone: "from-[#0ea5e9]/20 via-white to-slate-100" },
]

export function LoginScreen() {
  const { login, register, sendVerificationCode } = useStore()
  const [authOpen, setAuthOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>("register")
  const [identityType, setIdentityType] = useState<IdentityType>("phone")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [sent, setSent] = useState(false)
  const [selectedScene, setSelectedScene] = useState(publicScenes[0])
  const [demoPrompt, setDemoPrompt] = useState("夏季防晒新品上市，突出清爽、防水、户外通勤场景，画面高级干净。")

  const identity = identityType === "phone" ? phone.trim() : email.trim()
  const isPhone = identityType === "phone"

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
            <nav className="hidden items-center gap-6 text-sm text-slate-500 lg:flex">
              <a href="#demo" className="hover:text-slate-950">功能体验</a>
              <a href="#results" className="hover:text-slate-950">案例预览</a>
              <a href="#workflow" className="hover:text-slate-950">工作流</a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-full" onClick={() => openAuth("login")}>登录</Button>
              <Button className="rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800" onClick={() => openAuth("register")}>
                免费开始
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1fr)] lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/74 px-3 py-2 text-sm text-slate-600 shadow-sm">
              <BadgeCheck className="size-4 text-lime-600" />
              先体验功能，再注册保存和生成
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-7xl">
              先看到 AI 图片工作流，再决定注册使用
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              首页直接展示模板、需求输入、尺寸选择和结果预览。用户点击“生成真实图片、保存项目、导出素材”时，再用弹窗完成注册。
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {publicScenes.map((scene) => (
                <button
                  key={scene.name}
                  type="button"
                  onClick={() => setSelectedScene(scene)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm shadow-sm transition hover:-translate-y-0.5",
                    selectedScene.name === scene.name
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white/72 text-slate-600 hover:bg-white hover:text-slate-950",
                  )}
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </div>

          <div id="demo" className="rounded-[2rem] border border-white/80 bg-white/78 p-4 shadow-[0_34px_120px_rgba(15,23,42,0.13)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">公开功能体验</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">试一下生成流程</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">这里先展示能力，不要求注册。点击生成真实图片时再创建账号。</p>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#d9f99d] text-slate-950 shadow-sm">
                <Play className="size-5" />
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {publicScenes.map((scene) => (
                <button
                  key={scene.name}
                  type="button"
                  onClick={() => setSelectedScene(scene)}
                  className={cn(
                    "rounded-3xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                    selectedScene.name === scene.name ? "border-slate-950 ring-2 ring-slate-950/10" : "border-slate-200",
                  )}
                >
                  <div className={cn("h-20 rounded-2xl bg-gradient-to-br", scene.tone)} />
                  <p className="mt-3 text-sm font-semibold">{scene.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{scene.tag}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
              <div className="space-y-3">
                <Label>你的需求</Label>
                <Textarea
                  value={demoPrompt}
                  onChange={(event) => setDemoPrompt(event.target.value)}
                  className="min-h-32 resize-none rounded-3xl bg-white p-4 leading-7"
                  placeholder="描述产品、活动、目标人群、画面风格……"
                />
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">系统将自动组合</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedScene.prompt}；用户需求：{demoPrompt || "等待输入"}；自动加入品牌一致性、尺寸、安全反向提示词。
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-950 p-4 text-white">
                <p className="text-sm font-semibold">模拟输出预览</p>
                <div className={cn("mt-4 grid place-items-center rounded-3xl bg-gradient-to-br p-5 text-slate-950", selectedScene.tone)}>
                  <FileImage className="size-10 text-slate-500" />
                  <p className="mt-4 text-center text-sm font-semibold">{selectedScene.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedScene.tag} 商业素材</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="rounded-2xl" onClick={() => openAuth("register")}>保存项目</Button>
                  <Button className="rounded-2xl bg-[#d9f99d] text-slate-950 hover:bg-lime-200" onClick={() => openAuth("register")}>
                    生成真实图片
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="results" className="pb-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">无需注册即可看到结果形态</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">生成后会得到什么</h2>
            </div>
            <Button variant="outline" className="rounded-full bg-white/70" onClick={() => openAuth("register")}>
              <Download className="size-4" />
              登录后导出高清图
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {sampleResults.map((item) => (
              <button key={item.title} type="button" onClick={() => openAuth("register")} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                <div className={cn("aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br", item.tone)}>
                  <div className="flex h-full items-end p-4">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">预览图</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                  </div>
                  <ChevronRight className="size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="workflow" className="pb-16">
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-slate-200 bg-white/78 p-5 shadow-sm">
                <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
                  <item.icon className="size-5" />
                </span>
                <p className="mt-4 font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {authOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-[940px] overflow-hidden rounded-[2rem] border border-white/80 bg-[#f8f5ee] shadow-[0_34px_120px_rgba(15,23,42,0.28)]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_430px]">
              <section className="hidden bg-slate-950 p-8 text-white lg:block">
                <Button variant="ghost" className="mb-8 rounded-full text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setAuthOpen(false)}>
                  <X className="size-4" />
                  继续看功能
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
                      {mode === "register" ? "完成注册后进入完整工作台，获得试用额度。" : "使用手机号或邮箱继续进入你的素材工作台。"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setAuthOpen(false)}>
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
                    <p className="text-sm font-semibold">注册前可看功能，注册后可生成和保存。</p>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    登录即代表同意《用户协议》与《隐私政策》。原型仅作演示，请勿输入真实敏感信息。
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
