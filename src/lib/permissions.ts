import type { Role } from "@/generated/prisma/client"
import type { TeamCode } from "@/lib/teams"

export type SessionUser = {
  role: Role
  team: string | null
}

/** Can this user view any board for the given team? */
export function canViewTeam(user: SessionUser, team: TeamCode, board: "strategy" | "editor"): boolean {
  if (user.role === "CEO") return true
  if (user.role === "STRATEGIST") return true            // Strategists view all 4 boards.
  if (user.role === "EDITOR") return user.team === team && board === "editor"
  return false
}

/** Can this user mutate creatives that belong to this team? */
export function canWriteTeam(user: SessionUser, team: TeamCode): boolean {
  if (user.role === "CEO") return true
  if (user.role === "STRATEGIST") return user.team === team
  if (user.role === "EDITOR") return user.team === team
  return false
}
