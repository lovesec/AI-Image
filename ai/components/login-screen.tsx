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

const caseTabs = ["全部", "电商", "海报", "社媒", "品牌"]

const caseCards = [
  { type: "电商", title: "护肤新品主图", meta: "4:5 / 商品居中 / 卖点留白", prompt: "清爽防晒新品，透明瓶身，奶油白背景，水滴与户外光影", tone: "from-orange-100 via-white to-lime-100" },
  { type: "电商", title: "食品详情页首屏", meta: "4:5 / 食欲感 / 价格标签", prompt: "手作曲奇礼盒，暖光棚拍，礼盒打开，适合直播间主图", tone: "from-amber-100 via-white to-orange-100" },
  { type: "海报", title: "私域裂变活动", meta: "9:16 / 福利区 / 扫码区", prompt: "618 限时促销，强标题，红橙渐变，预留二维码和行动按钮", tone: "from-rose-100 via-white to-orange-100" },
  { type: "社媒", title: "小红书种草封面", meta: "1:1 / 大标题 / 生活方式", prompt: "通勤包种草封面，咖啡店桌面，醒目标题区，年轻轻奢风", tone: "from-pink-100 via-white to-sky-100" },
  { type: "品牌", title: "官网 Hero Banner", meta: "16:9 / 左文案右视觉", prompt: "SaaS 产品官网首屏，深色设备界面，右侧产品视觉，高级科技感", tone: "from-slate-100 via-white to-cyan-100" },
  { type: "品牌", title: "同款风格复刻", meta: "参考图 / 反推 prompt / 再生成", prompt: "上传参考图后提取配色、构图、材质和镜头语言，生成同风格素材", tone: "from-violet-100 via-white to-lime-100" },
]

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
  return (
    <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1fr)] lg:py-16">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/74 px-3 py-2 text-sm text-slate-600 shadow-sm">
          <BadgeCheck className="size-4 text-lime-600" />
          先看案例，再注册生成真实图片
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-7xl">
          面向商业投放的 AI 图片生产台
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          首页只讲清楚产品能解决什么问题；案例单独展示。用户看到想要的效果后，再点击生成同款、保存项目或导出高清图完成注册。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800" onClick={onShowCases}>
            查看案例
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" className="h-12 rounded-full bg-white/70 px-6" onClick={onAuth}>免费开始</Button>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_34px_120px_rgba(15,23,42,0.13)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Product Workflow</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">从模板到资产归档</h2>
          </div>
          <span className="grid size-12 place-items-center rounded-2xl bg-[#d9f99d] text-slate-950 shadow-sm">
            <Zap className="size-5" />
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {productPillars.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-white">
                <item.icon className="size-5" />
              </span>
              <p className="mt-4 font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl bg-slate-950 p-4 text-white">
          <p className="text-sm font-semibold">适合的商业场景</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["电商产品图", "活动海报", "社媒封面", "品牌 Banner"].map((item) => (
              <div key={item} className="rounded-2xl bg-white/[0.07] px-3 py-3 text-sm text-white/72 ring-1 ring-white/10">{item}</div>
            ))}
          </div>
        </div>
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
  return (
    <section className="py-10 lg:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">参考 Canva、Recraft、Photoroom、Kittl 的案例库结构整理</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">案例库</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            先让用户看到能生成什么，再引导注册生成同款。这里使用自有占位视觉，不复制第三方素材。
          </p>
        </div>
        <Button className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800" onClick={onAuth}>生成我的案例</Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {caseTabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCaseFilter(item)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm shadow-sm transition hover:-translate-y-0.5",
              caseFilter === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white/72 text-slate-600 hover:bg-white",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleCases.map((item) => (
          <article key={item.title} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white/82 p-4 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
            <div className={cn("aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br", item.tone)}>
              <div className="flex h-full flex-col justify-between p-4">
                <span className="w-fit rounded-full bg-white/82 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">{item.type}</span>
                <div className="rounded-2xl bg-white/78 p-3 shadow-sm backdrop-blur">
                  <FileImage className="size-5 text-slate-500" />
                  <p className="mt-2 text-sm font-semibold">{item.title}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                </div>
                <ChevronRight className="size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950" />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{item.prompt}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-2xl bg-white" onClick={onAuth}>
                  <Download className="size-4" />
                  导出高清
                </Button>
                <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={onAuth}>生成同款</Button>
              </div>
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
