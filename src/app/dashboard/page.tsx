import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { teamFromCode, TEAMS } from "@/lib/teams"

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { role, team } = session.user

  // Editors land on their team's editor board.
  if (role === "EDITOR") {
    const t = teamFromCode(team)
    if (!t) redirect("/login")
    redirect(`/dashboard/${t.slug}/editor`)
  }

  // Strategists land on their team's strategy board.
  if (role === "STRATEGIST") {
    const t = teamFromCode(team)
    if (!t) redirect("/login")
    redirect(`/dashboard/${t.slug}/strategy`)
  }

  // CEO defaults to ZAL strategy; navbar exposes the other three boards.
  redirect(`/dashboard/${TEAMS.ZAL.slug}/strategy`)
}
