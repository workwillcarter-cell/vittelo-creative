"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import type { Role } from "@/generated/prisma/client"
import { TEAMS, teamFromCode, type TeamCode } from "@/lib/teams"

const ROLE_LABELS: Record<Role, string> = {
  CEO: "CEO",
  STRATEGIST: "Strategist",
  EDITOR: "Editor",
}

type NavUser = { name?: string | null; role: Role; team: string | null }

export default function Navbar({ user }: { user: NavUser }) {
  const path = usePathname()

  const navLink = (href: string, label: string) => {
    const active = path === href
    return (
      <Link
        href={href}
        className={`text-sm transition-colors relative py-1 ${
          active
            ? "text-bloom-charcoal font-semibold"
            : "text-gray-500 hover:text-bloom-charcoal"
        }`}
      >
        {label}
        {active && (
          <span className="absolute -bottom-[14px] left-0 right-0 h-[2px] bg-bloom rounded-full" />
        )}
      </Link>
    )
  }

  // Each role sees a different set of board links.
  // CEO and STRATEGIST see all 4; EDITOR only sees their own editor board.
  const boardLinks: { href: string; label: string }[] = []
  if (user.role === "CEO" || user.role === "STRATEGIST") {
    for (const code of Object.keys(TEAMS) as TeamCode[]) {
      const t = TEAMS[code]
      boardLinks.push({ href: `/dashboard/${t.slug}/strategy`, label: t.strategistName })
      boardLinks.push({ href: `/dashboard/${t.slug}/editor`,   label: t.editorName })
    }
  } else if (user.role === "EDITOR") {
    const t = teamFromCode(user.team)
    if (t) boardLinks.push({ href: `/dashboard/${t.slug}/editor`, label: t.editorName })
  }

  // Display the personalised role label (e.g., "Zalan Strategy") when team-bound.
  let roleLabel: string = ROLE_LABELS[user.role]
  const team = teamFromCode(user.team)
  if (team) {
    if (user.role === "STRATEGIST") roleLabel = team.strategistName
    if (user.role === "EDITOR")     roleLabel = team.editorName
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-7">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/vittelo-logo.svg"
            alt="Vittelo"
            width={312}
            height={52}
            priority
            className="h-7 w-auto"
          />
        </Link>
        {boardLinks.map((l) => (
          <span key={l.href}>{navLink(l.href, l.label)}</span>
        ))}
        {user.role === "CEO" && navLink("/dashboard/team", "Team")}
        {user.role === "CEO" && navLink("/dashboard/setup", "Setup")}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-bloom-charcoal">{user.name}</p>
          <p className="text-xs text-gray-400">{roleLabel}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-bloom-charcoal transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
