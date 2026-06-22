"use client"

import { useState } from "react"
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Eye,
  History,
  ImageIcon,
  Layers3,
  LockKeyhole,
  Mail,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Wand2,
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

const useCases = ["电商主图", "活动海报", "社媒封面", "品牌 Banner", "反推同款"]

const productCards = [
  { icon: Wand2, title: "提示词模板运营", desc: "把行业经验沉淀成可配置模板", tone: "bg-[#d9f99d]" },
  { icon: Palette, title: "品牌风格约束", desc: "主色、风格词、禁用词统一注入", tone: "bg-[#fed7aa]" },
  { icon: History, title: "素材历史回溯", desc: "保存生成参数，支持再生成和归档", tone: "bg-[#bfdbfe]" },
]

const previewAssets = [
  { name: "新品首发详情页", ratio: "4:5", color: "from-orange-100 via-white to-lime-100" },
  { name: "品牌活动海报", ratio: "9:16", color: "from-rose-100 via-white to-orange-100" },
  { name: "官网 Hero Banner", ratio: "16:9", color: "from-slate-100 via-white to-cyan-100" },
]

export function LoginScreen() {
  const { login, register, sendVerificationCode } = useStore()
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(217,249,157,0.9),transparent_28%),radial-gradient(circle_at_84%_6%,rgba(251,146,60,0.26),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.8),rgba(241,245,249,0.3))]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full border border-slate-950/5" />

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
              <a href="#workflow" className="hover:text-slate-950">工作流</a>
              <a href="#cases" className="hover:text-slate-950">场景</a>
              <a href="#auth-panel" className="hover:text-slate-950">注册</a>
            </nav>
            <div className="flex items-center gap-2">
              <a href="#auth-panel" onClick={() => setMode("login")} className="rounded-full px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">登录</a>
              <a href="#auth-panel" onClick={() => setMode("register")} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                免费开始
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:py-16 xl:grid-cols-[minmax(0,1fr)_500px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/74 px-3 py-2 text-sm text-slate-600 shadow-sm">
              <BadgeCheck className="size-4 text-lime-600" />
              为增长团队设计的 AI 图片生产系统
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-7xl">
              首页即转化，注册即进入商业素材工作台
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              用户先理解产品价值，再在同一页完成手机号/邮箱注册。邀请码、验证码、密码设置直接嵌在首页里，减少跳页和认知断层。
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {useCases.map((item) => (
                <a key={item} href="#auth-panel" onClick={() => setMode("register")} className="rounded-full border border-slate-200 bg-white/72 px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-950">
                  {item}
                </a>
              ))}
            </div>

            <div id="workflow" className="mt-10 grid gap-3 md:grid-cols-3">
              {productCards.map((item) => (
                <div key={item.title} className="group rounded-3xl border border-slate-200 bg-white/78 p-4 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                  <span className={cn("grid size-11 place-items-center rounded-2xl text-slate-950", item.tone)}>
                    <item.icon className="size-5" />
                  </span>
                  <p className="mt-4 font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <div id="cases" className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_34px_120px_rgba(15,23,42,0.18)]">
              <div className="rounded-[1.5rem] bg-white/[0.06] p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Live Campaign Board</p>
                    <p className="mt-1 text-xs text-white/45">营销素材生产进度</p>
                  </div>
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#d9f99d] text-slate-950">
                    <Zap className="size-5" />
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {[["24", "模板"], ["128", "图片"], ["92%", "合规"]].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-white/[0.07] p-3">
                      <p className="text-2xl font-semibold">{value}</p>
                      <p className="mt-1 text-xs text-white/42">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                {previewAssets.map((asset) => (
                  <a key={asset.name} href="#auth-panel" onClick={() => setMode("register")} className="flex items-center gap-3 rounded-3xl bg-white p-3 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5">
                    <span className={cn("grid size-14 place-items-center rounded-2xl bg-gradient-to-br", asset.color)}>
                      <ImageIcon className="size-5 text-slate-500" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{asset.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{asset.ratio} · 注册生成同款</span>
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <aside id="auth-panel" className="scroll-mt-28 rounded-[2rem] border border-white/80 bg-white/82 p-5 shadow-[0_34px_120px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-7 lg:sticky lg:top-28">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{mode === "register" ? "新用户注册" : "已有账号登录"}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">{mode === "register" ? "创建工作台账号" : "登录工作台"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {mode === "register" ? "注册、验证、邀请码在同一个首页流程里，完成后直接进入创作台。" : "使用手机号或邮箱继续进入你的素材工作台。"}
                </p>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <LockKeyhole className="size-5" />
              </span>
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

            <div className="mt-6 grid grid-cols-3 gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              {[["10", "试用额度"], ["4", "单次出图"], ["本地", "原型数据"]].map(([value, label]) => (
                <div key={label}>
                  <p className="font-semibold">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <p className="text-sm font-semibold">生产版可接短信、邮箱、邀请码、套餐和组织账号。</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                登录即代表同意《用户协议》与《隐私政策》。原型仅作演示，请勿输入真实敏感信息。
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
