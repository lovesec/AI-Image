"use client"

// 原型阶段：用户体系/配额/邀请码/历史记录均存于客户端 localStorage（不接数据库）

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { AspectRatio, Industry, ImageType } from "./templates"

const FREE_QUOTA = 10

export interface InviteCode {
  code: string
  type: "new" | "channel" | "event"
  totalQuota: number
  usedQuota: number
  expiresAt: number
}

// 预置可用邀请码（原型演示）
const SEED_INVITE_CODES: InviteCode[] = [
  { code: "WELCOME20", type: "new", totalQuota: 20, usedQuota: 0, expiresAt: Date.now() + 30 * 864e5 },
  { code: "CHANNEL50", type: "channel", totalQuota: 50, usedQuota: 0, expiresAt: Date.now() + 30 * 864e5 },
  { code: "EXPIRED01", type: "event", totalQuota: 20, usedQuota: 0, expiresAt: Date.now() - 864e5 },
]

export interface GeneratedAsset {
  url: string
  width: number
  height: number
  format: string
}

export interface Job {
  id: string
  type: ImageType
  industry: Industry
  size: AspectRatio
  title: string
  detail: string
  customPrompt: string
  finalPrompt: string
  status: "success" | "failed"
  assets: GeneratedAsset[]
  count: number
  createdAt: number
}

export interface User {
  account: string
  quota: number
  token?: string
}

interface StoreState {
  user: User | null
  token: string | null
  inviteQuota: number
  appliedCode: string | null
  reversePromptDraft: string
  jobs: Job[]
  login: (account: string) => Promise<{ ok: boolean; message: string }>
  logout: () => void
  applyInviteCode: (code: string) => { ok: boolean; message: string }
  setReversePromptDraft: (text: string) => void
  // 优先扣邀请码额度，不足扣账户配额
  consumeQuota: (n: number) => boolean
  addJob: (job: Job) => void
  removeJob: (id: string) => void
}

const StoreContext = createContext<StoreState | null>(null)

const KEY = "ai-img-store-v1"

interface Persisted {
  token?: string | null
  user: User | null
  inviteQuota: number
  appliedCode: string | null
  reversePromptDraft?: string
  jobs: Job[]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [inviteQuota, setInviteQuota] = useState(0)
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [reversePromptDraft, setReversePromptDraft] = useState("")
  const [jobs, setJobs] = useState<Job[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const p: Persisted = JSON.parse(raw)
        setUser(p.user)
        setToken(p.token || null)
        setInviteQuota(p.inviteQuota ?? 0)
        setAppliedCode(p.appliedCode ?? null)
        setReversePromptDraft(p.reversePromptDraft || "")
        setJobs(p.jobs ?? [])
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const p: Persisted = { user, token, inviteQuota, appliedCode, reversePromptDraft, jobs }
    localStorage.setItem(KEY, JSON.stringify(p))
  }, [user, token, inviteQuota, appliedCode, reversePromptDraft, jobs, hydrated])

  const login = async (account: string) => {
    const normalized = account.trim()
    if (!normalized) {
      return { ok: false, message: "请输入有效账号" }
    }
    setUser({ account: normalized, quota: FREE_QUOTA })
    setToken(null)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: normalized }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok && data.user) {
        setUser({ account: data.user.emailOrPhone || normalized, quota: Number(data.user.quotaLeft ?? FREE_QUOTA), token: data.token })
        setToken(data.token || null)
        return { ok: true, message: "登录成功" }
      }
      return { ok: true, message: "登录成功（演示模式）" }
    } catch {
      return { ok: true, message: "登录成功（演示模式）" }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const applyInviteCode = (code: string) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return { ok: false, message: "请输入邀请码" }
    if (appliedCode === normalized) return { ok: false, message: "该邀请码已激活" }
    const found = SEED_INVITE_CODES.find((c) => c.code === normalized)
    if (!found) return { ok: false, message: "邀请码无效" }
    if (found.expiresAt < Date.now()) return { ok: false, message: "邀请码已过期" }
    const remaining = found.totalQuota - found.usedQuota
    if (remaining <= 0) return { ok: false, message: "邀请码额度已用尽" }
    setInviteQuota((q) => q + remaining)
    setAppliedCode(normalized)
    return { ok: true, message: `激活成功，获得 ${remaining} 次生成额度` }
  }

  const consumeQuota = (n: number) => {
    if (!user) return false
    const total = inviteQuota + user.quota
    if (total < n) return false
    let remain = n
    const fromInvite = Math.min(inviteQuota, remain)
    setInviteQuota((q) => q - fromInvite)
    remain -= fromInvite
    if (remain > 0) {
      setUser((u) => (u ? { ...u, quota: u.quota - remain } : u))
    }
    return true
  }

  const addJob = (job: Job) => setJobs((prev) => [job, ...prev])
  const removeJob = (id: string) => setJobs((prev) => prev.filter((j) => j.id !== id))

  return (
    <StoreContext.Provider
      value={{
        user,
        token,
        inviteQuota,
        appliedCode,
        reversePromptDraft,
        jobs,
        login,
        logout,
        applyInviteCode,
        setReversePromptDraft,
        consumeQuota,
        addJob,
        removeJob,
      }}
      >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
