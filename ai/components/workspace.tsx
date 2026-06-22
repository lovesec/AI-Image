"use client"

import { useState } from "react"
import {
  Archive,
  Boxes,
  Coins,
  History,
  LayoutTemplate,
  LogOut,
  Palette,
  Sparkles,
  Ticket,
  UserRound,
  Wand2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { GenerationProvider } from "@/lib/generation"
import { GeneratePanel } from "@/components/generate-panel"
import { HistoryView } from "@/components/history-view"
import { ReverseStylePanel } from "@/components/reverse-style-panel"

const productModules = [
  { icon: LayoutTemplate, label: "模板库", desc: "电商 / 海报 / 社媒" },
  { icon: Palette, label: "品牌资产", desc: "Logo / 色彩 / 常用词" },
  { icon: Archive, label: "项目归档", desc: "按活动保存素材" },
]

export function Workspace() {
  const { user, inviteQuota, logout, jobs } = useStore()
  const [tab, setTab] = useState("generate")

  const totalQuota = (user?.quota ?? 0) + inviteQuota

  return (
    <GenerationProvider>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="min-h-screen bg-[#f5f6f2] text-slate-950">
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#fbfbf7]/90 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-none">智图 Studio</p>
                  <p className="mt-1 text-xs text-slate-500">AI 营销视觉生产台</p>
                </div>
              </div>

              <TabsList className="hidden h-10 rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm lg:grid lg:w-[420px] lg:grid-cols-3">
                <TabsTrigger value="generate" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <Wand2 className="size-4" />
                  生成
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <History className="size-4" />
                  项目
                  {jobs.length > 0 ? <span className="ml-1 text-xs">{jobs.length}</span> : null}
                </TabsTrigger>
                <TabsTrigger value="reverse" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <Boxes className="size-4" />
                  同款
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Badge className="gap-1 rounded-full bg-emerald-100 px-3 text-emerald-700 hover:bg-emerald-100">
                  <Coins className="size-3.5" />
                  {totalQuota}
                </Badge>
                {inviteQuota > 0 ? (
                  <Badge variant="outline" className="hidden gap-1 rounded-full border-slate-300 bg-white sm:flex">
                    <Ticket className="size-3.5" />
                    {inviteQuota}
                  </Badge>
                ) : null}
                <span className="hidden items-center gap-1 text-sm text-slate-500 md:flex">
                  <UserRound className="size-3.5" />
                  {user?.account}
                </span>
                <Button variant="ghost" size="icon" onClick={logout} title="退出">
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-200/70 px-4 py-2 lg:hidden">
              <TabsList className="grid h-10 w-full grid-cols-3 rounded-full bg-white/80 p-1">
                <TabsTrigger value="generate" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  生成
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  项目
                </TabsTrigger>
                <TabsTrigger value="reverse" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  同款
                </TabsTrigger>
              </TabsList>
            </div>
          </header>

          <main className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-6 lg:py-6">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Workspace</p>
                  <h2 className="mt-2 text-lg font-semibold">商业素材工作流</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    从模板起点、品牌控制到批量生成，面向可投放素材生产。
                  </p>
                </div>

                <div className="space-y-2">
                  {productModules.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/65 p-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                          <item.icon className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              <TabsContent value="generate" className="mt-0">
                <GeneratePanel />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <HistoryView onRegenerate={() => setTab("generate")} />
              </TabsContent>

              <TabsContent value="reverse" className="mt-0">
                <ReverseStylePanel />
              </TabsContent>
            </section>
          </main>
        </div>
      </Tabs>
    </GenerationProvider>
  )
}
