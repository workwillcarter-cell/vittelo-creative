ALTER TABLE "Batch" ADD COLUMN "team" TEXT;

-- Backfill any existing batch to ZAL (only test data exists).
UPDATE "Batch" SET "team" = 'ZAL' WHERE "team" IS NULL;
