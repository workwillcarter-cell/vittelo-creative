# Vittelo Creative

## What this is
Vittelo Creative is a creative-production tracker for the Vittelo brand. It's a sister app to BloomaCare Creative — same stack, similar shape, but reshaped for Vittelo's two-team workflow. Strategists log ad concepts on a spreadsheet-style board, editors finalize them on a kanban. When all steps are done, ads auto-batch and get team-prefixed numbers (`ZAL100`, `VAL100`, etc.). Finished assets transfer to Dropbox.

Live site: **https://vittelo-creative.vercel.app**

## Who you're talking to
The user is **Will Carter** — non-technical CEO who runs the business, not an engineer. Communication rules:
- Use plain English, no jargon. Explain what a command does before asking him to run it.
- Pick implementation defaults yourself. Only ask product-level questions, not technical ones.
- Default login for testing: `admin@admanager.com` / `admin123`

## Stack
- Next.js 16.2.4 (App Router) · TypeScript · Tailwind v4
- Prisma + Neon Postgres (production DB)
- NextAuth (credentials provider, JWT sessions)
- Deployed on Vercel — auto-deploys on push to `main`

## Two-team architecture (the big difference from BloomaCare)
Every Creative, Batch, and User has a `team` field: **ZAL** or **VAL**.

- **ZAL team:** Zalan Strategy + Marvin Editor. Ad prefix `ZAL`. Dropbox folder `/Ads/ZAL`.
- **VAL team:** Valeriya Strategy + Elchard Editor. Ad prefix `VAL`. Dropbox folder `/Ads/VAL`.

Roles: `CEO`, `STRATEGIST`, `EDITOR` (no AI Generator like BloomaCare has). Permissions:
- **CEO** writes everything across both teams.
- **Strategist** can view all 4 boards but only writes on their own team's strategy + editor boards.
- **Editor** views/writes only their own team's editor board.

Routing: `/dashboard` auto-redirects by role; the actual board routes are `/dashboard/[team]/strategy` and `/dashboard/[team]/editor`.

Single source of truth for team config: **`src/lib/teams.ts`** (display names, ad prefix, Dropbox folder per team). Permission helpers live in **`src/lib/permissions.ts`** (server-side `canWriteTeam`).

## Other Vittelo-specific notes
- AIG board is removed entirely (Vittelo doesn't use AI generators).
- Project Type was renamed to **Product** with values: Men's Classic, Men's Tactical, Women's. Shown on editor cards.
- Strategist board has a **Landing Page** column (CEO-only edit) with 11 color-coded options.
- Batches are unsealed (no 10-per-batch cap) and sorted newest-first within.
- Branding: black/zinc monochrome palette, Vittelo wordmark SVG. The legacy `bloom-*` CSS var names are kept but repointed to the Vittelo palette — don't rename them.
- `next.config.ts` needs `dangerouslyAllowSVG: true` for the Vittelo logo.
- Dropbox transfer no longer creates a per-ad subfolder — files go straight into `/Ads/ZAL/{adName}V1.{ext}` (or `V2`, `V3`).

## Live data is sacred
Real users log real projects and batches in the production database every day. Two rules:
1. **Code changes are always safe** — pushing new code deploys a new app version but doesn't touch existing rows.
2. **Schema changes are not safe by default.** Anything involving Prisma migrations, dropping columns, renaming fields, or `prisma migrate` commands must be flagged to Will explicitly before running. Discuss the impact, decide together. Never run a destructive migration without confirmation.

If anything goes wrong post-deploy, Vercel can roll back to any previous deployment in one click — point Will at the Vercel dashboard's Deployments tab.

## Sister app
There's a sister app called **BloomaCare Creative** (separate repo at `~/ClaudeProjects/ad-manager`, separate Vercel project, separate Neon DB). Cross-app bug fixes usually need to be applied in both — they share most of the codebase but have drifted (BloomaCare has the AIG board, no team split).

## Workflow when Will makes a request
1. Make the change
2. Test it locally if possible (`npm run dev` may already be running in another terminal)
3. Commit with a clear message
4. `git push` — Vercel auto-deploys in ~1 minute
5. Tell Will when it's live

If a request affects both apps, do it in one repo first, get confirmation it works, then apply to the other.
