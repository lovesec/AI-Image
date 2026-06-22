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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">{typeLabel(job.type)}</Badge>
            <Badge variant="secondary" className="rounded-full bg-lime-100 text-lime-800">
              {industryLabel(job.industry)}
            </Badge>
            <Badge variant="outline" className="rounded-full border-slate-300 text-slate-600">
              {job.size}
            </Badge>
          </div>
          {job.title ? <p className="mt-3 truncate text-sm text-slate-500">主题：<span className="text-slate-950">{job.title}</span></p> : null}
        </div>
        <Button size="sm" onClick={onReroll} disabled={loading} className="rounded-full bg-white hover:bg-slate-50" variant="outline">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          换一批
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[1500px]:grid-cols-2">
        {job.assets.map((asset, i) => (
          <div key={i} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
            <div className={cn("relative bg-slate-100", box)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url || "/placeholder.svg"} alt={`${typeLabel(job.type)} 方案 ${i + 1}`} className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                <Button size="sm" variant="secondary" className="rounded-full bg-white/90 shadow-sm" onClick={() => window.open(asset.url, "_blank")}>
                  <Maximize2 className="size-4" />
                  查看
                </Button>
                <Button size="sm" className="rounded-full bg-slate-950 text-white hover:bg-slate-800" onClick={() => downloadImage(asset.url, `marketing-${job.id.slice(0, 6)}-${i + 1}.png`)}>
                  <Download className="size-4" />
                  下载
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-slate-500">方案 {i + 1}</span>
              <button onClick={() => downloadImage(asset.url, `marketing-${job.id.slice(0, 6)}-${i + 1}.png`)} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
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
