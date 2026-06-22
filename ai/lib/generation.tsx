"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { useStore, type Job } from "@/lib/store"
import { checkBannedWords, type AspectRatio, type ImageType, type Industry } from "@/lib/templates"

export interface GenerateParams {
  type: ImageType
  industry: Industry
  size: AspectRatio
  title: string
  detail: string
  customPrompt: string
  finalPrompt: string
  count: number
}

export interface ReversePromptResult {
  inferredPrompt: string
  style: Record<string, string>
  negativeHints: string[]
  source?: Record<string, unknown>
}

interface ReversePromptParams {
  imageBase64: string
  imageMime: string
}

interface GenerationState {
  loading: boolean
  reverseLoading: boolean
  reverseResult: ReversePromptResult | null
  currentJob: Job | null
  setCurrentJob: (job: Job | null) => void
  generate: (params: GenerateParams) => Promise<void>
  reversePrompt: (params: ReversePromptParams) => Promise<ReversePromptResult | null>
}

const Ctx = createContext<GenerationState | null>(null)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeBackendAssets = (
  raw: Array<{
    url?: string
    width?: number
    height?: number
    format?: string
  }>,
) =>
  raw.map((asset) => ({
    url: asset.url || "",
    width: Number(asset.width || 0),
    height: Number(asset.height || 0),
    format: asset.format || "png",
  }))

export function GenerationProvider({ children }: { children: ReactNode }) {
  const { user, inviteQuota, consumeQuota, addJob, token } = useStore()
  const [loading, setLoading] = useState(false)
  const [reverseLoading, setReverseLoading] = useState(false)
  const [reverseResult, setReverseResult] = useState<ReversePromptResult | null>(null)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)

  const totalQuota = (user?.quota ?? 0) + inviteQuota
  const makeAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const pollBackendJob = async (jobId: string) => {
    const headers = makeAuthHeaders()
    let status = "queued"
    for (let i = 0; i < 50; i++) {
      try {
        const jobRes = await fetch(`/api/jobs/${jobId}`, { headers })
        if (jobRes.ok) {
          const jobPayload = await jobRes.json().catch(() => ({}))
          const job = (jobPayload as { job?: { status?: string } }).job || jobPayload
          status = String(job?.status || "").toLowerCase()

          if (status === "done" || status === "partial") {
            const assetRes = await fetch(`/api/jobs/${jobId}/assets`, { headers })
            const assetPayload = await assetRes.json().catch(() => ({}))
            const assets = normalizeBackendAssets(Array.isArray(assetPayload?.assets) ? assetPayload.assets : [])
            return { status, assets }
          }
          if (status === "failed") {
            return { status, assets: [] as Array<{ url: string; width: number; height: number; format: string }> }
          }
        }
      } catch {
        // ignore and retry
      }
      await sleep(900)
    }

    return { status: "timeout", assets: [] as Array<{ url: string; width: number; height: number; format: string }> }
  }

  const reversePrompt = async ({ imageBase64, imageMime }: ReversePromptParams) => {
    setReverseLoading(true)
    setReverseResult(null)
    try {
      const headers = makeAuthHeaders()
      const res = await fetch("/api/reverse-prompt", {
        method: "POST",
        headers,
        body: JSON.stringify({ imageBase64, imageMime }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          toast.error("反推功能需要登录后使用（请重新登录）")
        } else {
          toast.error(data?.error || "反推失败，请稍后重试")
        }
        return null
      }

      const result: ReversePromptResult = {
        inferredPrompt: data.inferredPrompt || "",
        style: data.style || {},
        negativeHints: Array.isArray(data.negativeHints) ? data.negativeHints : [],
        source: data.source,
      }

      setReverseResult(result)
      if (result.inferredPrompt) {
        toast.success("反推完成，可直接应用到自定义提示词")
      } else {
        toast.info("反推成功，但未提取到明显风格文案")
      }
      return result
    } catch {
      toast.error("反推请求失败，请检查网络")
      return null
    } finally {
      setReverseLoading(false)
    }
  }

  const generate = async (params: GenerateParams) => {
    const banned = checkBannedWords(`${params.title} ${params.detail} ${params.customPrompt}`)
    if (banned.length) {
      toast.error(`提示词包含违规词：${banned.join("、")}`)
      return
    }
    if (totalQuota < params.count) {
      toast.error("额度不足，请使用邀请码或升级套餐")
      return
    }

    setLoading(true)
    try {
      const headers = makeAuthHeaders()
      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: params.finalPrompt,
          size: params.size,
          ratio: params.size,
          type: params.type,
          industry: params.industry,
          title: params.title,
          subtitle: params.detail,
          customPrompt: params.customPrompt,
          count: params.count,
        }),
      })
      const data = await res.json().catch(() => ({}))

      const base = {
        id: crypto.randomUUID(),
        type: params.type,
        industry: params.industry,
        size: params.size,
        title: params.title,
        detail: params.detail,
        customPrompt: params.customPrompt,
        finalPrompt: params.finalPrompt,
        count: params.count,
        createdAt: Date.now(),
      }

      if (!res.ok) {
        const failed: Job = { ...base, status: "failed", assets: [] }
        addJob(failed)
        setCurrentJob(failed)
        if (res.status === 401) {
          toast.error("生成需要登录后调用（请先登录）")
        } else {
          toast.error(data.error || "生成失败，请重试")
        }
        return
      }

      if (Array.isArray(data.assets)) {
        consumeQuota(params.count)
        const success: Job = {
          ...base,
          status: "success",
          assets: data.assets,
        }
        addJob(success)
        setCurrentJob(success)
        if (data.demo) {
          toast.info(data.note || "演示模式：已返回占位图")
        } else {
          toast.success(`生成成功，已扣减 ${params.count} 次额度`)
        }
        return
      }

      if (data.jobId) {
        const result = await pollBackendJob(data.jobId)
        if (result.status === "done" || result.status === "partial") {
          if (!result.assets.length) {
            const failed: Job = { ...base, status: "failed", assets: [] }
            addJob(failed)
            setCurrentJob(failed)
            toast.error("后端任务完成但未返回图片")
            return
          }
          consumeQuota(params.count)
          const success: Job = {
            ...base,
            status: "success",
            assets: result.assets,
          }
          addJob(success)
          setCurrentJob(success)
          toast.success(`生成成功，已扣减 ${params.count} 次额度`)
          return
        }

        const failed: Job = { ...base, status: "failed", assets: [] }
        addJob(failed)
        setCurrentJob(failed)
        toast.error(data.error || (result.status === "timeout" ? "生成超时，请稍后查看历史记录" : "生成失败"))
        return
      }

      // 兼容旧返回结构
      const fallback: Job = { ...base, status: "failed", assets: [] }
      addJob(fallback)
      setCurrentJob(fallback)
      toast.error("服务返回格式不兼容")
    } catch {
      toast.error("网络异常，请检查连接后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Ctx.Provider
      value={{
        loading,
        reverseLoading,
        reverseResult,
        currentJob,
        setCurrentJob,
        generate,
        reversePrompt,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useGeneration() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useGeneration must be used within GenerationProvider")
  return ctx
}
