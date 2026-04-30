-- Rename Role enum value AI_GENERATOR -> STRATEGIST.
-- Postgres ≥10 supports ALTER TYPE ... RENAME VALUE without rewriting rows.
ALTER TYPE "Role" RENAME VALUE 'AI_GENERATOR' TO 'STRATEGIST';

-- Add team column to User (nullable; CEO has no team).
ALTER TABLE "User" ADD COLUMN "team" TEXT;

-- Add team column to Creative (nullable; existing rows get backfilled to ZAL below).
ALTER TABLE "Creative" ADD COLUMN "team" TEXT;

-- Backfill: any existing creative on the Vittelo DB belongs to the ZAL team
-- (only test data exists so far). New creatives must always specify a team.
UPDATE "Creative" SET "team" = 'ZAL' WHERE "team" IS NULL;
