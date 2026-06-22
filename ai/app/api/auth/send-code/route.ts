import { sendVerificationCode } from "@/lib/server/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const result = await sendVerificationCode(String(body.identity || ""))
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: result.status })
  }
  return Response.json(result)
}
