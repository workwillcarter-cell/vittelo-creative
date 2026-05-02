import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TEAMS, type TeamCode } from "@/lib/teams"
import { canWriteTeam } from "@/lib/permissions"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const creative = await prisma.creative.findUnique({
    where: { id },
    include: {
      history: { include: { changedBy: { select: { name: true } } }, orderBy: { changedAt: "desc" } },
      batch: { select: { name: true, id: true } },
    },
  })

  if (!creative) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(creative)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Team gate: load the creative's team and confirm the user can write to it.
  const ownership = await prisma.creative.findUnique({ where: { id }, select: { team: true } })
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!ownership.team || !canWriteTeam({ role: session.user.role, team: session.user.team }, ownership.team as TeamCode)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  const {
    concept, briefLink, finishedAdLink, learnings,
    adNumber, launchDate, result, spend, roas, extraInfo, ceoStatus,
    projectType, style, landingPage, needsRevision, revisionDetails, revisionComplete,
    editorStatus, editorNotes, editorNeedsRevision, editorRevisionDetails, editorRevisionComplete,
    editorDriveLink, usedInAd,
  } = body

  // Auto-set launch date when CEO marks Launched
  let autoLaunchDate: Date | undefined = undefined
  if (ceoStatus === "LAUNCHED" && launchDate === undefined) {
    const existing = await prisma.creative.findUnique({ where: { id }, select: { launchDate: true } })
    if (!existing?.launchDate) autoLaunchDate = new Date()
  }

  // Auto-assign to Editor board when CEO marks Moved to Editor
  let autoEditorStatus: string | undefined = undefined
  if (ceoStatus === "MOVED_TO_EDITOR") {
    const existing = await prisma.creative.findUnique({ where: { id }, select: { editorStatus: true } })
    if (!existing?.editorStatus) autoEditorStatus = "ASSIGNED"
  }

  // Auto-mark CEO Ready when Editor finishes (COMPLETE)
  let autoCeoStatus: string | undefined = undefined
  if (editorStatus === "COMPLETE" && ceoStatus === undefined) {
    const existing = await prisma.creative.findUnique({ where: { id }, select: { ceoStatus: true } })
    if (existing?.ceoStatus !== "READY" && existing?.ceoStatus !== "LAUNCHED") {
      autoCeoStatus = "READY"
    }
  }

  const effectiveCeoStatus = autoCeoStatus ?? ceoStatus

  // When effectively READY, auto-assign batch + ad name
  let batchId: string | undefined = undefined
  let autoAdNumber: string | undefined = undefined
  if (effectiveCeoStatus === "READY") {
    const existing = await prisma.creative.findUnique({
      where: { id },
      select: { batchId: true, adNumber: true },
    })

    if (!existing?.batchId) {
      // Vittelo: unsealed, unlimited batches, scoped per team.
      const openBatch = await prisma.batch.findFirst({
        where: { sealed: false, team: ownership.team },
        orderBy: { createdAt: "asc" },
      })
      if (!openBatch) {
        const teamBatchCount = await prisma.batch.count({ where: { team: ownership.team } })
        const batchNumber = teamBatchCount + 1
        const newBatch = await prisma.batch.create({
          data: {
            name: `Batch ${batchNumber}`,
            number: batchNumber,
            sealed: false,
            team: ownership.team,
            createdById: session.user.id,
          },
        })
        batchId = newBatch.id
      } else {
        batchId = openBatch.id
      }
    }

    if (!existing?.adNumber && adNumber === undefined) {
      const teamCfg = TEAMS[ownership.team as TeamCode]
      const prefix = teamCfg.adPrefix
      const named = await prisma.creative.findMany({
        where: { adNumber: { startsWith: prefix }, team: ownership.team },
        select: { adNumber: true },
      })
      const numRe = new RegExp(`^${prefix}(\\d+)$`)
      const maxNum = named.reduce((max, c) => {
        const m = c.adNumber?.match(numRe)
        if (!m) return max
        const n = parseInt(m[1], 10)
        return Number.isNaN(n) ? max : Math.max(max, n)
      }, 99)
      autoAdNumber = `${prefix}${maxNum + 1}`
    }
  }

  const creative = await prisma.creative.update({
    where: { id },
    data: {
      ...(concept !== undefined && { concept }),
      ...(briefLink !== undefined && { briefLink: briefLink || null }),
      ...(finishedAdLink !== undefined && { finishedAdLink: finishedAdLink || null }),
      ...(learnings !== undefined && { learnings: learnings || null }),
      ...(adNumber !== undefined && { adNumber: adNumber || null }),
      ...(launchDate !== undefined && { launchDate: launchDate ? new Date(launchDate) : null }),
      ...(result !== undefined && { result: result || null }),
      ...(spend !== undefined && { spend: spend !== null ? Number(spend) : null }),
      ...(roas !== undefined && { roas: roas !== null ? Number(roas) : null }),
      ...(extraInfo !== undefined && { extraInfo: extraInfo || null }),
      ...(ceoStatus !== undefined && { ceoStatus: ceoStatus || null }),
      ...(projectType !== undefined && { projectType: projectType || null }),
      ...(style !== undefined && { style: style || null }),
      ...(landingPage !== undefined && { landingPage: landingPage || null }),
      ...(needsRevision !== undefined && { needsRevision }),
      ...(revisionDetails !== undefined && { revisionDetails: revisionDetails || null }),
      ...(revisionComplete !== undefined && { revisionComplete }),
      ...(editorStatus !== undefined && { editorStatus: editorStatus || null }),
      ...(editorNotes !== undefined && { editorNotes: editorNotes || null }),
      ...(editorNeedsRevision !== undefined && { editorNeedsRevision }),
      ...(editorRevisionDetails !== undefined && { editorRevisionDetails: editorRevisionDetails || null }),
      ...(editorRevisionComplete !== undefined && { editorRevisionComplete }),
      ...(editorDriveLink !== undefined && { editorDriveLink: editorDriveLink || null }),
      ...(usedInAd !== undefined && { usedInAd: usedInAd || null }),
      ...(batchId !== undefined && { batchId }),
      ...(autoLaunchDate !== undefined && { launchDate: autoLaunchDate }),
      ...(autoEditorStatus !== undefined && { editorStatus: autoEditorStatus }),
      ...(autoCeoStatus !== undefined && { ceoStatus: autoCeoStatus }),
      ...(autoAdNumber !== undefined && { adNumber: autoAdNumber }),
    },
  })

  return NextResponse.json(creative)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const ownership = await prisma.creative.findUnique({ where: { id }, select: { team: true } })
  if (!ownership) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!ownership.team || !canWriteTeam({ role: session.user.role, team: session.user.team }, ownership.team as TeamCode)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.$transaction([
    prisma.stageHistory.deleteMany({ where: { creativeId: id } }),
    prisma.creative.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
