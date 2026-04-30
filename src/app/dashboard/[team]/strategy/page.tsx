import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import CEOBoard from "@/components/CEOBoard"
import { teamFromSlug } from "@/lib/teams"
import { canViewTeam, canWriteTeam } from "@/lib/permissions"

export default async function TeamStrategyPage({ params }: { params: Promise<{ team: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { team: teamSlug } = await params
  const team = teamFromSlug(teamSlug)
  if (!team) notFound()

  const sessionUser = { role: session.user.role, team: session.user.team }
  if (!canViewTeam(sessionUser, team.code, "strategy")) redirect("/dashboard")
  const writable = canWriteTeam(sessionUser, team.code)

  const CREATIVE_SELECT = {
    id: true, concept: true, briefLink: true, adNumber: true,
    extraInfo: true, launchDate: true, result: true, learnings: true,
    spend: true, roas: true, stage: true, ceoStatus: true,
    projectType: true, style: true, landingPage: true,
    editorDriveLink: true,
  }

  const batches = await prisma.batch.findMany({
    where: { creatives: { some: { team: team.code } } },
    orderBy: { createdAt: "desc" },
    include: {
      creatives: {
        where: { team: team.code },
        orderBy: { createdAt: "desc" },
        select: CREATIVE_SELECT,
      },
    },
  })

  const unassigned = await prisma.creative.findMany({
    where: { batchId: null, team: team.code },
    orderBy: { createdAt: "asc" },
    select: CREATIVE_SELECT,
  })

  return (
    <CEOBoard
      batches={batches}
      unassigned={unassigned}
      title={team.strategistName}
      subtitle="Creative concept tracking"
      teamCode={team.code}
      readOnly={!writable}
    />
  )
}
