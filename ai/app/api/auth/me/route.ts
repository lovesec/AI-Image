import { getUserFromRequest } from "@/lib/server/auth"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return Response.json({ ok: false, error: "未登录或会话已过期" }, { status: 401 })
  }
  return Response.json({ ok: true, user })
}
