"use client"

import { useState } from "react"
import { Sparkles, Mail, Phone, ImageIcon, Wand2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

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
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* 左侧品牌区 */}
      <section className="relative flex-1 bg-primary text-primary-foreground p-8 lg:p-14 flex flex-col justify-between overflow-hidden">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Sparkles className="size-6" />
          <span>智图 · AI 营销图生成</span>
        </div>
        <div className="relative z-10 max-w-md py-12">
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-balance">
            选行业、填需求，一键生成可投放的营销图
          </h1>
          <p className="mt-4 text-primary-foreground/80 leading-relaxed">
            内置行业提示词模板与反向提示词，告别繁琐 prompt 编写，稳定输出宣传海报、电商主图、社媒配图。
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: Wand2, t: "模板化提示词", d: "行业 + 类型自动拼接专业提示词" },
              { icon: ImageIcon, t: "单次最多 4 张", d: "支持重绘、改文案、多比例" },
              { icon: History, t: "历史记录可回溯", d: "保存参数与结果，一键再生成" },
            ].map((f) => (
              <li key={f.t} className="flex items-start gap-3">
                <span className="mt-0.5 grid place-items-center size-9 rounded-lg bg-primary-foreground/15 shrink-0">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{f.t}</p>
                  <p className="text-sm text-primary-foreground/70">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-primary-foreground/60">原型演示版本 · 数据仅保存在本地浏览器</p>
      </section>

      {/* 右侧登录区 */}
      <section className="flex-1 flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">登录 / 注册</h2>
          <p className="mt-1 text-muted-foreground text-sm">未注册的账号将自动创建并赠送试用额度</p>

          <Tabs defaultValue="phone" className="mt-8">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="phone">
                <Phone className="size-4 mr-1.5" />
                手机号
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="size-4 mr-1.5" />
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
                  />
                </div>
              )}
              <Button className="w-full" onClick={handlePhoneLogin}>
                {sent ? "登录" : "获取验证码"}
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
                />
              </div>
              <Button className="w-full" onClick={handleEmailLogin}>
                发送登录链接并登录
              </Button>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
            登录即代表同意《用户协议》与《隐私政策》。原型仅作演示，请勿输入真实敏感信息。
          </p>
        </div>
      </section>
    </main>
  )
}
