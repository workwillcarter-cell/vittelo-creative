import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import EditorBoard from "@/components/EditorBoard"
import { teamFromSlug } from "@/lib/teams"
import { canViewTeam, canWriteTeam } from "@/lib/permissions"

export default async function TeamEditorPage({ params }: { params: Promise<{ team: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { team: teamSlug } = await params
  const team = teamFromSlug(teamSlug)
  if (!team) notFound()

  const sessionUser = { role: session.user.role, team: session.user.team }
  if (!canViewTeam(sessionUser, team.code, "editor")) redirect("/dashboard")
  const writable = canWriteTeam(sessionUser, team.code)

  const cards = await prisma.creative.findMany({
    where: { editorStatus: { not: null }, team: team.code },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, concept: true, briefLink: true,
      editorDriveLink: true, editorNotes: true, editorStatus: true,
      editorNeedsRevision: true, editorRevisionDetails: true, editorRevisionComplete: true,
      usedInAd: true, adNumber: true, projectType: true, team: true,
      transferStatus: true, transferError: true, transferredAt: true, dropboxPath: true,
      updatedAt: true,
      batch: { select: { name: true } },
    },
  })

  const flat = cards.map((c) => ({
    ...c,
    batchName: c.batch?.name ?? null,
    batch: undefined,
    transferredAt: c.transferredAt?.toISOString() ?? null,
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="-m-6 p-6 bg-zinc-900 min-h-[calc(100vh-88px)]">
      <EditorBoard
        cards={flat}
        userRole={session.user.role}
        title={team.editorName}
        readOnly={!writable}
      />
    </div>
  )
}
