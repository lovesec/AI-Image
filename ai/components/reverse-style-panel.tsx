"use client"

import { ChangeEvent, useMemo, useState } from "react"
import { AlertCircle, Check, Clipboard, ImageUp, Loader2, Wand2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useGeneration } from "@/lib/generation"
import { useStore } from "@/lib/store"

const MAX_REFERENCE_IMAGE_SIZE = 2.5 * 1024 * 1024

export function ReverseStylePanel() {
  const { reversePrompt, reverseLoading, reverseResult } = useGeneration()
  const { setReversePromptDraft, reversePromptDraft } = useStore()

  const [referenceImage, setReferenceImage] = useState("")
  const [referenceMime, setReferenceMime] = useState("image/jpeg")

  const result = reverseResult

  const promptText = useMemo(() => result?.inferredPrompt?.trim() || "", [result])

  const handleReferenceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件")
      return
    }

    if (file.size > MAX_REFERENCE_IMAGE_SIZE) {
      toast.error("参考图建议小于 2.5MB")
      return
    }

    setReferenceMime(file.type || "image/jpeg")
    const reader = new FileReader()
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : ""
      setReferenceImage(raw)
    }
    reader.readAsDataURL(file)
    event.currentTarget.value = ""
  }

  const runReverse = async () => {
    if (!referenceImage) {
      toast.error("请先上传参考图片")
      return
    }

    const res = await reversePrompt({
      imageBase64: referenceImage,
      imageMime: referenceMime,
    })

    if (!res?.inferredPrompt) {
      toast.info("反推成功，但未提取到明显风格文案")
      return
    }

    toast.success("反推完成，可复制结果并应用到生成")
  }

  const copyPrompt = async () => {
    if (!promptText) return
    try {
      await navigator.clipboard.writeText(promptText)
      toast.success("已复制到剪贴板")
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  const fillGeneratePrompt = () => {
    if (!promptText) {
      toast.error("先反推出提示词")
      return
    }

    setReversePromptDraft(promptText)
    toast.success("已写入生成器的自定义提示词草稿")
  }

  const clearImage = () => {
    setReferenceImage("")
    setReferenceMime("image/jpeg")
  }

  const writeFromHistory = () => {
    if (!reversePromptDraft.trim()) {
      toast.error("生成页还没有可回填的提示词")
      return
    }
    navigator.clipboard.writeText(reversePromptDraft.trim()).catch(() => {
      // ignore
    })
    toast.success("已从历史草稿读取成功")
  }

  return (
    <Card className="p-6 space-y-4 border border-border/70 bg-white/75 backdrop-blur-sm">
      <div>
        <div className="text-lg font-semibold flex items-center gap-2">
          <span className="grid place-items-center size-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
            <Wand2 className="size-4" />
          </span>
          反推风格（同款参考）独立功能
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          上传一张参考图，提取构图、色彩、灯光和氛围关键词，生成可复用提示词。
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          type="file"
          accept="image/*"
          onChange={handleReferenceChange}
          className="file:text-xs file:border-0 file:bg-muted file:text-muted-foreground"
        />
        <Button
          type="button"
          disabled={!referenceImage || reverseLoading}
          onClick={runReverse}
          className="sm:w-44 bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600"
        >
          {reverseLoading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          {reverseLoading ? "反推中…" : "开始反推"}
        </Button>
      </div>

      {referenceImage ? (
        <div className="relative rounded-xl border bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={referenceImage} alt="参考图片" className="w-full max-h-60 object-cover" />
          <Button
            size="icon"
            variant="secondary"
            onClick={clearImage}
            className="absolute top-2 right-2"
            title="清空图片"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded-xl border bg-sky-50/80 dark:bg-sky-900/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="size-4" />
            反推结果
            {!!promptText && <Badge variant="outline">可复用</Badge>}
          </div>

          {promptText ? (
            <Textarea value={promptText} readOnly rows={6} className="resize-none text-xs leading-relaxed" />
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="size-4" />
              未提取到可用风格文案，建议更换清晰参考图
            </p>
          )}

          {Object.entries(result.style || {}).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(result.style).map(([key, value]) =>
                value ? (
                  <Badge key={key} variant="outline">
                    {key}：{value}
                  </Badge>
                ) : null,
              )}
            </div>
          ) : null}

          {!!result.negativeHints.length ? (
            <div>
              <p className="text-xs text-muted-foreground">建议排除项</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {result.negativeHints.slice(0, 6).join("，")}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={copyPrompt}
              disabled={!promptText}
              variant="outline"
              size="sm"
              className="border-sky-300/80"
            >
              <Clipboard className="size-4" />
              复制提示词
            </Button>
            <Button
              type="button"
              onClick={fillGeneratePrompt}
              disabled={!promptText}
              size="sm"
              className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600"
            >
              <Check className="size-4" />
              写入生成器草稿
            </Button>
            {reversePromptDraft ? (
              <Button
                type="button"
                variant="outline"
                onClick={writeFromHistory}
                size="sm"
                className="border-slate-300 dark:border-slate-600"
              >
                填充历史草稿
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
