import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TEAM_CODES, type TeamCode } from "@/lib/teams"
import { canWriteTeam } from "@/lib/permissions"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "EDITOR") {
    return NextResponse.json({ error: "Editors cannot create creatives" }, { status: 403 })
  }

  const { concept, briefLink, team } = await req.json()
  if (!concept?.trim()) return NextResponse.json({ error: "concept required" }, { status: 400 })

  // Resolve which team the new creative belongs to. Strategists may only create
  // in their own team; CEO must explicitly pass the team in the request.
  let resolvedTeam: TeamCode | null = null
  if (typeof team === "string" && (TEAM_CODES as readonly string[]).includes(team)) {
    resolvedTeam = team as TeamCode
  } else if (session.user.role === "STRATEGIST" && session.user.team) {
    resolvedTeam = session.user.team as TeamCode
  }
  if (!resolvedTeam) {
    return NextResponse.json({ error: "team required" }, { status: 400 })
  }

  if (!canWriteTeam({ role: session.user.role, team: session.user.team }, resolvedTeam)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const creative = await prisma.creative.create({
    data: {
      concept: concept.trim(),
      briefLink: briefLink || null,
      team: resolvedTeam,
      createdById: session.user.id,
    },
  })

  await prisma.stageHistory.create({
    data: { creativeId: creative.id, toStage: "IDEATION", changedById: session.user.id },
  })

  return NextResponse.json(creative, { status: 201 })
}
