"use client"

import { History, Download, RefreshCw, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useGeneration } from "@/lib/generation"
import { RATIOS, typeLabel, industryLabel } from "@/lib/templates"

function formatTime(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function download(url: string, name: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function HistoryView({ onRegenerate }: { onRegenerate: () => void }) {
  const { jobs, removeJob } = useStore()
  const { generate, loading } = useGeneration()

  if (jobs.length === 0) {
    return (
      <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-10 border-dashed border-sky-300/70 bg-white/70">
        <span className="grid place-items-center size-16 rounded-2xl bg-accent text-primary">
          <History className="size-8" />
        </span>
        <h3 className="mt-4 text-lg font-medium">还没有生成记录</h3>
        <p className="mt-1 text-sm text-muted-foreground">完成一次生成后，记录会自动保存在这里。</p>
      </Card>
    )
  }

  const handleRegenerate = (job: (typeof jobs)[number]) => {
    onRegenerate()
    generate({
      type: job.type,
      industry: job.industry,
      size: job.size,
      title: job.title,
      detail: job.detail,
      customPrompt: job.customPrompt,
      finalPrompt: job.finalPrompt,
      count: job.count,
    })
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        const box = RATIOS.find((r) => r.value === job.size)?.box ?? "aspect-square"
        return (
          <Card key={job.id} className="p-4 bg-white/80 border border-border/70 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{typeLabel(job.type)}</Badge>
                <Badge
                  variant="secondary"
                  className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
                >
                  {industryLabel(job.industry)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-sky-300/80 text-sky-700 dark:border-sky-500/50 dark:text-sky-200"
                >
                  {job.size}
                </Badge>
                {job.status === "success" ? (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <CheckCircle2 className="size-3.5" />
                    成功
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <XCircle className="size-3.5" />
                    失败
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{formatTime(job.createdAt)}</span>
            </div>

            {job.title && (
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">主题：</span>
                {job.title}
              </p>
            )}

            {job.status === "success" && job.assets.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {job.assets.map((asset, i) => (
                  <button
                    key={i}
                    onClick={() => download(asset.url, `history-${job.id.slice(0, 6)}-${i + 1}.png`)}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border bg-muted",
                      box,
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url || "/placeholder.svg"}
                      alt={`记录 ${i + 1}`}
                      className="absolute inset-0 size-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity text-background">
                      <Download className="size-4" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={loading} onClick={() => handleRegenerate(job)} className="bg-white/80">
                <RefreshCw className="size-4" />
                再次生成同款
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeJob(job.id)} className="text-destructive">
                <Trash2 className="size-4" />
                删除
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
