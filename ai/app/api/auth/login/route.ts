import { loginUser } from "@/lib/server/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const result = await loginUser({
    identity: String(body.identity || ""),
    password: body.password ? String(body.password) : undefined,
    code: body.code ? String(body.code) : undefined,
  })
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: result.status })
  }
  return Response.json({ ok: true, user: result.user, token: result.token })
}
