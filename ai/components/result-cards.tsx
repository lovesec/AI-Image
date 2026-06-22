"use client"

import { Download, RefreshCw, Loader2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RATIOS, typeLabel, industryLabel } from "@/lib/templates"
import type { Job } from "@/lib/store"

function downloadImage(url: string, name: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function ResultCards({
  job,
  loading,
  onReroll,
}: {
  job: Job
  loading: boolean
  onReroll: () => void
}) {
  const box = RATIOS.find((r) => r.value === job.size)?.box ?? "aspect-square"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{typeLabel(job.type)}</Badge>
          <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
            {industryLabel(job.industry)}
          </Badge>
          <Badge variant="outline" className="border-sky-300/80 text-sky-700 dark:border-sky-500/50 dark:text-sky-200">
            {job.size}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={onReroll}
          disabled={loading}
          className="bg-white/70 hover:bg-white"
          variant="outline"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          换一批
        </Button>
      </div>

      {job.title && (
        <p className="text-sm text-muted-foreground">
          主题：<span className="text-foreground">{job.title}</span>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {job.assets.map((asset, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-xl border bg-white/80 shadow-sm dark:bg-slate-900/40"
          >
            <div className={cn("relative", box)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url || "/placeholder.svg"}
                alt={`${typeLabel(job.type)} 方案 ${i + 1}`}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(asset.url, "_blank")}
                >
                  <Maximize2 className="size-4" />
                  查看
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                  onClick={() => downloadImage(asset.url, `marketing-${job.id.slice(0, 6)}-${i + 1}.png`)}
                >
                  <Download className="size-4" />
                  下载
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5">
              <span className="text-xs text-muted-foreground">方案 {i + 1}</span>
              <button
                onClick={() => downloadImage(asset.url, `marketing-${job.id.slice(0, 6)}-${i + 1}.png`)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Download className="size-3" />
                PNG
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
