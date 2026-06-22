"use client"

import { useState } from "react"
import {
  ArrowRight,
  BadgeCheck,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

const proofItems = ["电商主图", "活动海报", "社媒封面", "品牌 Banner"]

const featureCards = [
  { icon: Wand2, title: "行业提示词模板", desc: "把优秀 prompt 沉淀为可复用模板" },
  { icon: Palette, title: "品牌一致性", desc: "颜色、风格、禁用词统一控制" },
  { icon: History, title: "素材可回溯", desc: "历史参数保存，一键再生成" },
]

const promptCards = [
  { title: "新品上市主图", meta: "4:5 电商转化", tone: "bg-[#d9f99d]" },
  { title: "私域裂变海报", meta: "9:16 活动传播", tone: "bg-[#fed7aa]" },
  { title: "品牌官网 Banner", meta: "16:9 官网首屏", tone: "bg-[#bfdbfe]" },
]

export function LoginScreen() {
  const { login } = useStore()
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [sent, setSent] = useState(false)

  const handlePhoneLogin = () => {
    if (!/^1\d{10}$/.test(phone)) {
      toast.error("请输入有效的手机号")
      return
    }
    if (!sent) {
      setSent(true)
      toast.success("验证码已发送（原型演示：输入任意 4 位即可）")
      return
    }
    if (code.length < 4) {
      toast.error("请输入验证码")
      return
    }
    void (async () => {
      const result = await login(phone)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })()
  }

  const handleEmailLogin = () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("请输入有效的邮箱")
      return
    }
    void (async () => {
      const result = await login(email)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f1e8] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(217,249,157,0.9),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(251,146,60,0.24),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(241,245,249,0.36))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-950/20 to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] gap-8 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:p-6">
        <section className="flex min-h-[58vh] flex-col rounded-[2rem] border border-white/70 bg-white/42 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:min-h-[calc(100vh-3rem)] lg:p-10">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.25)]">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="font-semibold leading-none">智图 Studio</p>
                <p className="mt-1 text-xs text-slate-500">AI 商业视觉生产台</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-500 shadow-sm sm:flex">
              <ShieldCheck className="size-4 text-emerald-500" />
              原型演示 · 本地安全存储
            </div>
          </nav>

          <div className="grid flex-1 items-center gap-8 py-10 xl:grid-cols-[minmax(0,0.95fr)_420px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/74 px-3 py-2 text-sm text-slate-600 shadow-sm">
                <BadgeCheck className="size-4 text-lime-600" />
                为电商、运营、设计团队打造
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-tight text-slate-950 sm:text-6xl xl:text-7xl">
                把 AI 生成图变成可交付的商业素材工作流
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                从行业模板、品牌风格、投放尺寸到历史归档，帮助团队稳定生成宣传海报、电商产品图、社媒封面和 Banner。
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {proofItems.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white/72 px-4 py-2 text-sm text-slate-600 shadow-sm">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid gap-3 md:grid-cols-3">
                {featureCards.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-slate-200 bg-white/76 p-4 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                    <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-white">
                      <item.icon className="size-5" />
                    </span>
                    <p className="mt-4 font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden xl:block">
              <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-lime-200 blur-3xl" />
              <div className="relative rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-[0_30px_100px_rgba(15,23,42,0.24)]">
                <div className="rounded-[1.5rem] bg-white/[0.06] p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Campaign Studio</p>
                      <p className="mt-1 text-xs text-white/45">今日素材产能</p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-2xl bg-lime-300 text-slate-950">
                      <Zap className="size-5" />
                    </span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {[
                      ["42", "生成图"],
                      ["18", "模板"],
                      ["96%", "通过率"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl bg-white/[0.07] p-3">
                        <p className="text-xl font-semibold">{value}</p>
                        <p className="mt-1 text-xs text-white/42">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {promptCards.map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-3xl bg-white p-3 text-slate-950 shadow-sm">
                      <span className={`grid size-12 place-items-center rounded-2xl ${item.tone}`}>
                        <ImageIcon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                      </div>
                      <ArrowRight className="size-4 text-slate-400" />
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-[#d9f99d] p-4 text-slate-950">
                  <div className="flex items-center gap-2">
                    <Layers3 className="size-5" />
                    <p className="font-semibold">品牌资产已接入</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">品牌色、风格词、禁用词会自动合并到生成提示词。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center lg:min-h-[calc(100vh-3rem)]">
          <div className="w-full rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">开始使用</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">登录 / 注册</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">未注册账号会自动创建，并赠送试用额度。</p>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <LockKeyhole className="size-5" />
              </span>
            </div>

            <Tabs defaultValue="phone" className="mt-8">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-full bg-slate-100 p-1">
                <TabsTrigger value="phone" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Phone className="mr-1.5 size-4" />
                  手机号
                </TabsTrigger>
                <TabsTrigger value="email" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Mail className="mr-1.5 size-4" />
                  邮箱
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 rounded-2xl bg-white"
                  />
                </div>
                {sent && (
                  <div className="space-y-2">
                    <Label htmlFor="code">验证码</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      placeholder="请输入验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-12 rounded-2xl bg-white"
                    />
                  </div>
                )}
                <Button className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={handlePhoneLogin}>
                  {sent ? "登录并进入工作台" : "获取验证码"}
                  <ArrowRight className="size-4" />
                </Button>
              </TabsContent>

              <TabsContent value="email" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-2xl bg-white"
                  />
                </div>
                <Button className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" onClick={handleEmailLogin}>
                  发送登录链接并登录
                  <ArrowRight className="size-4" />
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-8 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              {[
                ["10", "试用额度"],
                ["4", "单次出图"],
                ["0", "本地敏感数据"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              登录即代表同意《用户协议》与《隐私政策》。原型仅作演示，请勿输入真实敏感信息。
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
