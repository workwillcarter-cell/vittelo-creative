import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canWriteTeam } from "@/lib/permissions"
import type { TeamCode } from "@/lib/teams"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      creatives: {
        include: { history: { include: { changedBy: { select: { name: true } } }, orderBy: { changedAt: "desc" } } },
        orderBy: { createdAt: "asc" },
      },
      createdBy: { select: { name: true } },
    },
  })

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(batch)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const ownership = await prisma.batch.findUnique({ where: { id }, select: { team: true } })
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!ownership.team || !canWriteTeam({ role: session.user.role, team: session.user.team }, ownership.team as TeamCode)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { name } = await req.json()
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const batch = await prisma.batch.update({
    where: { id },
    data: { name: name.trim() },
  })

  return NextResponse.json(batch)
}
