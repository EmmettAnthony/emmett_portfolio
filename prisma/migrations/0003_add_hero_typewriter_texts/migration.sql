-- Add heroTypewriterTexts column to homepage table
ALTER TABLE "homepage" ADD COLUMN "heroTypewriterTexts" JSONB NOT NULL DEFAULT '[]';
