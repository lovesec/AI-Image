import { registerUser } from "@/lib/server/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const result = await registerUser({
    identity: String(body.identity || ""),
    password: String(body.password || ""),
    code: String(body.code || ""),
    inviteCode: body.inviteCode ? String(body.inviteCode) : undefined,
  })
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: result.status })
  }
  return Response.json({ ok: true, user: result.user, token: result.token })
}
