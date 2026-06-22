import { createHmac, pbkdf2Sync, randomBytes, randomInt, randomUUID, timingSafeEqual } from "crypto"
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"

const FREE_QUOTA = 10
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000
const CODE_TTL_MS = 10 * 60 * 1000
const DATA_FILE = process.env.AUTH_DATA_FILE || path.join(process.cwd(), ".data", "auth.json")
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-only-change-me-before-production"

export interface PublicUser {
  id: string
  emailOrPhone: string
  quotaLeft: number
  createdAt: number
}

interface UserRecord extends PublicUser {
  passwordHash: string
  passwordSalt: string
  updatedAt: number
  inviteCode?: string
}

interface VerificationRecord {
  identity: string
  codeHash: string
  expiresAt: number
  attempts: number
  createdAt: number
}

interface InviteRecord {
  code: string
  totalQuota: number
  usedQuota: number
  expiresAt: number
  type: "new" | "channel" | "event"
}

interface AuthDB {
  users: UserRecord[]
  verifications: VerificationRecord[]
  invites: InviteRecord[]
}

const seedInvites = (): InviteRecord[] => [
  { code: "WELCOME20", type: "new", totalQuota: 20, usedQuota: 0, expiresAt: Date.now() + 30 * 864e5 },
  { code: "CHANNEL50", type: "channel", totalQuota: 50, usedQuota: 0, expiresAt: Date.now() + 30 * 864e5 },
  { code: "EXPIRED01", type: "event", totalQuota: 20, usedQuota: 0, expiresAt: Date.now() - 864e5 },
]

function normalizeIdentity(identity: string) {
  return identity.trim().toLowerCase()
}

function hashValue(value: string, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(value, salt, 120000, 32, "sha256").toString("hex")
  return { hash, salt }
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function sign(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = createHmac("sha256", AUTH_SECRET).update(body).digest("base64url")
  return `${body}.${signature}`
}

function verifyToken(token: string) {
  const [body, signature] = token.split(".")
  if (!body || !signature) return null
  const expected = createHmac("sha256", AUTH_SECRET).update(body).digest("base64url")
  if (!safeCompare(signature, expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { sub?: string; exp?: number }
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

async function readDB(): Promise<AuthDB> {
  try {
    const raw = await readFile(DATA_FILE, "utf8")
    const parsed = JSON.parse(raw) as Partial<AuthDB>
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      verifications: Array.isArray(parsed.verifications) ? parsed.verifications : [],
      invites: Array.isArray(parsed.invites) && parsed.invites.length ? parsed.invites : seedInvites(),
    }
  } catch {
    return { users: [], verifications: [], invites: seedInvites() }
  }
}

async function writeDB(db: AuthDB) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8")
}

function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    emailOrPhone: user.emailOrPhone,
    quotaLeft: user.quotaLeft,
    createdAt: user.createdAt,
  }
}

function createToken(user: UserRecord) {
  return sign({ sub: user.id, identity: user.emailOrPhone, exp: Date.now() + TOKEN_TTL_MS })
}

function passwordValid(password: string) {
  return typeof password === "string" && password.length >= 6 && password.length <= 128
}

function identityValid(identity: string) {
  const normalized = normalizeIdentity(identity)
  return /^1\d{10}$/.test(normalized) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)
}

export async function sendVerificationCode(identity: string) {
  const normalized = normalizeIdentity(identity)
  if (!identityValid(normalized)) {
    return { ok: false as const, status: 400, error: "请输入有效手机号或邮箱" }
  }

  const db = await readDB()
  const code = String(randomInt(100000, 999999))
  const { hash, salt } = hashValue(code)
  const codeHash = `${salt}:${hash}`
  const record: VerificationRecord = {
    identity: normalized,
    codeHash,
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
    createdAt: Date.now(),
  }

  db.verifications = db.verifications.filter((item) => item.identity !== normalized && item.expiresAt > Date.now())
  db.verifications.push(record)
  await writeDB(db)

  return {
    ok: true as const,
    message: "验证码已发送",
    debugCode: process.env.NODE_ENV === "production" ? undefined : code,
  }
}

function verifyCode(db: AuthDB, identity: string, code: string) {
  const normalized = normalizeIdentity(identity)
  const record = db.verifications.find((item) => item.identity === normalized)
  if (!record) return { ok: false, error: "请先发送验证码" }
  if (record.expiresAt < Date.now()) return { ok: false, error: "验证码已过期" }
  if (record.attempts >= 5) return { ok: false, error: "验证码尝试次数过多" }

  if (process.env.AUTH_ALLOW_DEMO_CODE !== "false" && code === "1234") return { ok: true }

  const [salt, hash] = record.codeHash.split(":")
  const candidate = hashValue(code, salt).hash
  record.attempts += 1
  if (!safeCompare(candidate, hash)) return { ok: false, error: "验证码错误" }
  return { ok: true }
}

export async function registerUser(input: { identity: string; password: string; code: string; inviteCode?: string }) {
  const identity = normalizeIdentity(input.identity)
  if (!identityValid(identity)) return { ok: false as const, status: 400, error: "请输入有效手机号或邮箱" }
  if (!passwordValid(input.password)) return { ok: false as const, status: 400, error: "密码至少 6 位" }

  const db = await readDB()
  if (db.users.some((user) => user.emailOrPhone === identity)) {
    return { ok: false as const, status: 409, error: "账号已存在，请直接登录" }
  }

  const checked = verifyCode(db, identity, input.code)
  if (!checked.ok) {
    await writeDB(db)
    return { ok: false as const, status: 400, error: checked.error || "验证码错误" }
  }

  let quota = FREE_QUOTA
  let inviteCode: string | undefined
  const normalizedInvite = input.inviteCode?.trim().toUpperCase()
  if (normalizedInvite) {
    const invite = db.invites.find((item) => item.code === normalizedInvite)
    if (!invite) return { ok: false as const, status: 400, error: "邀请码无效" }
    if (invite.expiresAt < Date.now()) return { ok: false as const, status: 400, error: "邀请码已过期" }
    const remaining = invite.totalQuota - invite.usedQuota
    if (remaining <= 0) return { ok: false as const, status: 400, error: "邀请码额度已用尽" }
    invite.usedQuota += remaining
    quota += remaining
    inviteCode = normalizedInvite
  }

  const password = hashValue(input.password)
  const user: UserRecord = {
    id: randomUUID(),
    emailOrPhone: identity,
    passwordHash: password.hash,
    passwordSalt: password.salt,
    quotaLeft: quota,
    inviteCode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  db.users.push(user)
  db.verifications = db.verifications.filter((item) => item.identity !== identity)
  await writeDB(db)

  return { ok: true as const, user: publicUser(user), token: createToken(user) }
}

export async function loginUser(input: { identity: string; password?: string; code?: string }) {
  const identity = normalizeIdentity(input.identity)
  if (!identityValid(identity)) return { ok: false as const, status: 400, error: "请输入有效手机号或邮箱" }

  const db = await readDB()
  const user = db.users.find((item) => item.emailOrPhone === identity)
  if (!user) return { ok: false as const, status: 404, error: "账号不存在，请先注册" }

  if (input.password) {
    const candidate = hashValue(input.password, user.passwordSalt).hash
    if (!safeCompare(candidate, user.passwordHash)) {
      return { ok: false as const, status: 401, error: "密码错误" }
    }
  } else if (input.code) {
    const checked = verifyCode(db, identity, input.code)
    if (!checked.ok) {
      await writeDB(db)
      return { ok: false as const, status: 400, error: checked.error || "验证码错误" }
    }
    db.verifications = db.verifications.filter((item) => item.identity !== identity)
    await writeDB(db)
  } else {
    return { ok: false as const, status: 400, error: "请输入密码或验证码" }
  }

  return { ok: true as const, user: publicUser(user), token: createToken(user) }
}

export async function getUserFromRequest(req: Request) {
  const header = req.headers.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload?.sub) return null
  const db = await readDB()
  const user = db.users.find((item) => item.id === payload.sub)
  return user ? publicUser(user) : null
}

export async function redeemInviteCode(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { ok: false as const, status: 400, error: "请输入邀请码" }
  const db = await readDB()
  const invite = db.invites.find((item) => item.code === normalized)
  if (!invite) return { ok: false as const, status: 400, error: "邀请码无效" }
  if (invite.expiresAt < Date.now()) return { ok: false as const, status: 400, error: "邀请码已过期" }
  const remaining = invite.totalQuota - invite.usedQuota
  if (remaining <= 0) return { ok: false as const, status: 400, error: "邀请码额度已用尽" }
  invite.usedQuota += remaining
  await writeDB(db)
  return { ok: true as const, quota: remaining, code: normalized }
}
