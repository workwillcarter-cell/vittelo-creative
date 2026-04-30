// Vittelo team configuration. The slug is what appears in URLs (/dashboard/zal/strategy);
// `team` is the persisted database value; everything else is just display.
//
// Adding a new team is a single object literal here — no other file should hard-code
// team identifiers (with the exception of the migration that introduced the column).

export type TeamCode = "ZAL" | "VAL"

export type TeamConfig = {
  code: TeamCode
  slug: string             // URL slug: /dashboard/{slug}/...
  strategistName: string   // human label for strategist board
  editorName: string       // human label for editor board
  adPrefix: string         // ad number prefix: e.g. "ZAL" → ZAL100, ZAL101...
  dropboxFolder: string    // subfolder inside the App folder root
}

export const TEAMS: Record<TeamCode, TeamConfig> = {
  ZAL: {
    code: "ZAL",
    slug: "zal",
    strategistName: "Zalan Strategy",
    editorName: "Marvin Editor",
    adPrefix: "ZAL",
    dropboxFolder: "/Ads/ZAL",
  },
  VAL: {
    code: "VAL",
    slug: "val",
    strategistName: "Valeriya Strategy",
    editorName: "Elchard Editor",
    adPrefix: "VAL",
    dropboxFolder: "/Ads/VAL",
  },
}

export const TEAM_CODES: TeamCode[] = ["ZAL", "VAL"]

export function teamFromSlug(slug: string): TeamConfig | null {
  for (const team of Object.values(TEAMS)) {
    if (team.slug === slug) return team
  }
  return null
}

export function teamFromCode(code: string | null | undefined): TeamConfig | null {
  if (!code) return null
  return TEAMS[code as TeamCode] ?? null
}
