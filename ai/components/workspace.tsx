"use client"

import { useState } from "react"
import {
  Archive,
  BadgeCheck,
  Boxes,
  Brush,
  Coins,
  FileImage,
  FolderKanban,
  History,
  ImageIcon,
  Layers3,
  LayoutTemplate,
  LogOut,
  Palette,
  Plus,
  Rocket,
  ShoppingBag,
  Sparkles,
  Ticket,
  Upload,
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
  { icon: LayoutTemplate, label: "模板库", desc: "电商 / 海报 / 社媒", tab: "templates" },
  { icon: Palette, label: "品牌资产", desc: "Logo / 色彩 / 常用词", tab: "brand" },
  { icon: Archive, label: "项目归档", desc: "按活动保存素材", tab: "history" },
]

const templateCategories = [
  { icon: ShoppingBag, name: "电商爆品", count: 24, tone: "bg-orange-100 text-orange-700" },
  { icon: ImageIcon, name: "社媒封面", count: 18, tone: "bg-sky-100 text-sky-700" },
  { icon: Rocket, name: "活动促销", count: 16, tone: "bg-lime-100 text-lime-700" },
  { icon: FileImage, name: "品牌 Banner", count: 12, tone: "bg-slate-100 text-slate-700" },
]

const templateCards = [
  { title: "新品首发详情页", scene: "电商 / 4:5", desc: "首屏主视觉、卖点卡、价格区、购买引导" },
  { title: "私域裂变海报", scene: "活动 / 9:16", desc: "强标题、福利区、扫码区、行动按钮" },
  { title: "小红书种草封面", scene: "社媒 / 1:1", desc: "醒目标题、产品场景、生活方式氛围" },
  { title: "官网 Hero Banner", scene: "品牌 / 16:9", desc: "品牌主张、产品视觉、CTA 留白" },
]

const brandAssets = [
  { label: "主品牌色", value: "#111827", tone: "bg-slate-950" },
  { label: "强调色", value: "#F97316", tone: "bg-orange-500" },
  { label: "增长色", value: "#D9F99D", tone: "bg-lime-200" },
  { label: "科技色", value: "#0EA5E9", tone: "bg-sky-500" },
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

              <TabsList className="hidden h-10 rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm lg:grid lg:w-[620px] lg:grid-cols-5">
                <TabsTrigger value="generate" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <Wand2 className="size-4" />
                  生成
                </TabsTrigger>
                <TabsTrigger value="templates" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <LayoutTemplate className="size-4" />
                  模板
                </TabsTrigger>
                <TabsTrigger value="brand" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <Palette className="size-4" />
                  品牌
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  <FolderKanban className="size-4" />
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
              <TabsList className="grid h-10 w-full grid-cols-5 rounded-full bg-white/80 p-1">
                <TabsTrigger value="generate" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  生成
                </TabsTrigger>
                <TabsTrigger value="templates" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  模板
                </TabsTrigger>
                <TabsTrigger value="brand" className="rounded-full data-[state=active]:bg-slate-950 data-[state=active]:text-white">
                  品牌
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
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => setTab(item.tab)}
                      className="w-full rounded-2xl border border-slate-200 bg-white/65 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
                          <item.icon className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              <TabsContent value="generate" className="mt-0">
                <GeneratePanel />
              </TabsContent>

              <TabsContent value="templates" className="mt-0">
                <TemplateLibraryView onUseTemplate={() => setTab("generate")} />
              </TabsContent>

              <TabsContent value="brand" className="mt-0">
                <BrandKitView />
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

function TemplateLibraryView({ onUseTemplate }: { onUseTemplate: () => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-[#10130f] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="rounded-full bg-lime-300 text-slate-950 hover:bg-lime-300">Template Market</Badge>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight lg:text-5xl">
              从模板开始，而不是从空白提示词开始
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/62">
              把高频商业场景沉淀成模板，用户只需要替换产品、卖点和活动信息。
            </p>
          </div>
          <Button className="rounded-full bg-white text-slate-950 hover:bg-lime-100" onClick={onUseTemplate}>
            <Plus className="size-4" />
            新建生成
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {templateCategories.map((item) => (
          <div key={item.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className={`grid size-11 place-items-center rounded-2xl ${item.tone}`}>
              <item.icon className="size-5" />
            </span>
            <p className="mt-4 font-semibold">{item.name}</p>
            <p className="mt-1 text-sm text-slate-500">{item.count} 个可复用模板</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">推荐模板</p>
            <p className="mt-1 text-xs text-slate-500">按转化场景组织，方便后续接后台配置</p>
          </div>
          <Button variant="outline" className="rounded-full">
            <Upload className="size-4" />
            导入模板
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {templateCards.map((item) => (
            <button
              type="button"
              key={item.title}
              onClick={onUseTemplate}
              className="group rounded-2xl border border-slate-200 bg-[#fbfbf7] p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-950 hover:bg-white hover:shadow-md"
            >
              <div className="aspect-[4/5] rounded-2xl bg-[linear-gradient(145deg,#111827,#f97316_62%,#d9f99d)] p-4 text-white">
                <p className="text-xs text-white/60">{item.scene}</p>
                <p className="mt-3 text-xl font-semibold leading-tight">{item.title}</p>
              </div>
              <p className="mt-4 font-medium">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function BrandKitView() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">Brand Control</Badge>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight lg:text-5xl">
                把每次生成锁进品牌系统
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                品牌色、Logo 安全区、常用卖点词和负面约束，会成为后续每次生成的默认上下文。
              </p>
            </div>
            <Button className="rounded-full bg-slate-950 text-white hover:bg-slate-800">
              <BadgeCheck className="size-4" />
              保存品牌资产
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="font-semibold">品牌色板</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {brandAssets.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 p-3">
                  <span className={`block h-20 rounded-2xl ${item.tone}`} />
                  <p className="mt-3 text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="font-semibold">卖点词库</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["限时福利", "新品上市", "专业可信", "真实质感", "高转化", "适合投放", "同款风格", "品牌统一"].map((word) => (
                <span key={word} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                  {word}
                </span>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-orange-50 p-4">
              <p className="text-sm font-medium text-orange-800">默认负面约束</p>
              <p className="mt-2 text-sm leading-6 text-orange-700/80">
                避免水印、乱码文字、侵权 logo、畸形主体、杂乱背景和低分辨率。
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-[#10130f] p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <p className="font-semibold">品牌预览</p>
        <div className="mt-5 aspect-[4/5] rounded-3xl bg-[linear-gradient(160deg,#111827_0%,#f97316_58%,#d9f99d_100%)] p-5">
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <p className="text-xs text-white/60">Campaign Visual</p>
            <p className="mt-3 text-2xl font-semibold leading-tight">新品上市，统一品牌风格</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {[
            { icon: Brush, label: "色彩锁定", value: "4 色" },
            { icon: Layers3, label: "模板可复用", value: "70+" },
            { icon: History, label: "历史版本", value: "自动保存" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <span className="inline-flex items-center gap-2 text-sm text-white/72">
                <item.icon className="size-4 text-lime-200" />
                {item.label}
              </span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
