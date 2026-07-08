import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/creatives/mark-paid
// Body: { team?: string }   — optional team filter (Vittelo scope per team)
// CEO-only. Marks every Complete/Paid editor card with editorPaid=false as paid.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "CEO") {
    return NextResponse.json({ error: "Only CEO can bulk mark paid" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const team: string | undefined = typeof body.team === "string" ? body.team : undefined

  const result = await prisma.creative.updateMany({
    where: {
      editorStatus: { in: ["EDITED", "COMPLETE", "PAID"] },
      editorPaid: false,
      ...(team ? { team } : {}),
    },
    data: { editorPaid: true },
  })

  return NextResponse.json({ updated: result.count })
}
