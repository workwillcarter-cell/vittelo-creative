-- Track whether the CEO has paid the editor for each creative.
-- Independent of editorStatus column (a card in COMPLETE can be paid, a card in PAID can be unpaid).
ALTER TABLE "Creative" ADD COLUMN "editorPaid" BOOLEAN NOT NULL DEFAULT false;
