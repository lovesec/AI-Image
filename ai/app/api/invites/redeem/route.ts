import { getUserFromRequest, redeemInviteCode } from "@/lib/server/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return Response.json({ ok: false, error: "请先登录" }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const result = await redeemInviteCode(String(body.code || ""))
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: result.status })
  }
  return Response.json({ ok: true, quota: result.quota, code: result.code })
}
