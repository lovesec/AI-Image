"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { AspectRatio, Industry, ImageType } from "./templates"

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
  id?: string
  account: string
  quota: number
  token?: string
}

interface AuthResult {
  ok: boolean
  message: string
}

interface AuthInput {
  identity: string
  password?: string
  code?: string
  inviteCode?: string
}

interface StoreState {
  user: User | null
  token: string | null
  inviteQuota: number
  appliedCode: string | null
  reversePromptDraft: string
  jobs: Job[]
  sendVerificationCode: (identity: string) => Promise<AuthResult & { debugCode?: string }>
  register: (input: AuthInput) => Promise<AuthResult>
  login: (input: string | AuthInput) => Promise<AuthResult>
  logout: () => void
  applyInviteCode: (code: string) => { ok: boolean; message: string }
  setReversePromptDraft: (text: string) => void
  consumeQuota: (n: number) => boolean
  addJob: (job: Job) => void
  removeJob: (id: string) => void
}

const StoreContext = createContext<StoreState | null>(null)
const KEY = "ai-img-store-v2"

interface Persisted {
  token?: string | null
  user: User | null
  inviteQuota: number
  appliedCode: string | null
  reversePromptDraft?: string
  jobs: Job[]
}

function toUser(data: { id?: string; emailOrPhone?: string; quotaLeft?: number; token?: string }): User {
  return {
    id: data.id,
    account: data.emailOrPhone || "",
    quota: Number(data.quotaLeft ?? 0),
    token: data.token,
  }
}

async function readJson(res: Response) {
  return res.json().catch(() => ({})) as Promise<Record<string, unknown>>
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
        setToken(p.token || p.user?.token || null)
        setInviteQuota(p.inviteQuota ?? 0)
        setAppliedCode(p.appliedCode ?? null)
        setReversePromptDraft(p.reversePromptDraft || "")
        setJobs(p.jobs ?? [])
      }
    } catch {
      // ignore invalid persisted state
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const p: Persisted = { user, token, inviteQuota, appliedCode, reversePromptDraft, jobs }
    localStorage.setItem(KEY, JSON.stringify(p))
  }, [user, token, inviteQuota, appliedCode, reversePromptDraft, jobs, hydrated])

  useEffect(() => {
    if (!hydrated || !token) return
    void (async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await readJson(res)
      if (!res.ok || !data.ok || !data.user) {
        setUser(null)
        setToken(null)
        return
      }
      const nextUser = toUser(data.user as { id?: string; emailOrPhone?: string; quotaLeft?: number })
      setUser({ ...nextUser, token })
    })()
  }, [hydrated, token])

  const setSession = (payload: Record<string, unknown>) => {
    const nextToken = String(payload.token || "")
    const nextUser = toUser(payload.user as { id?: string; emailOrPhone?: string; quotaLeft?: number; token?: string })
    setToken(nextToken)
    setUser({ ...nextUser, token: nextToken })
  }

  const sendVerificationCode = async (identity: string) => {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity }),
    })
    const data = await readJson(res)
    if (!res.ok || !data.ok) {
      return { ok: false, message: String(data.error || "验证码发送失败") }
    }
    return {
      ok: true,
      message: data.debugCode ? `验证码已发送，开发验证码：${data.debugCode}` : "验证码已发送",
      debugCode: data.debugCode ? String(data.debugCode) : undefined,
    }
  }

  const register = async (input: AuthInput) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    const data = await readJson(res)
    if (!res.ok || !data.ok) {
      return { ok: false, message: String(data.error || "注册失败") }
    }
    setSession(data)
    setInviteQuota(0)
    setAppliedCode(input.inviteCode?.trim().toUpperCase() || null)
    return { ok: true, message: "注册成功" }
  }

  const login = async (input: string | AuthInput) => {
    const payload = typeof input === "string" ? { identity: input } : input
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await readJson(res)
    if (!res.ok || !data.ok) {
      return { ok: false, message: String(data.error || "登录失败") }
    }
    setSession(data)
    return { ok: true, message: "登录成功" }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const applyInviteCode = (code: string) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return { ok: false, message: "请输入邀请码" }
    if (appliedCode === normalized) return { ok: false, message: "该邀请码已激活" }
    setAppliedCode(normalized)
    setInviteQuota((q) => q + 20)
    return { ok: true, message: "邀请码已记录，生产版会由服务端校验额度" }
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
        sendVerificationCode,
        register,
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
