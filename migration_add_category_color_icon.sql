-- Migration to add color and icon columns to categories table
-- This allows storing visual styling information for categories

-- Add color and icon columns to categories table
ALTER TABLE "categories" 
ADD COLUMN "color" TEXT DEFAULT '#01C38D',
ADD COLUMN "icon" TEXT DEFAULT '📦';

-- Add indexes for better performance (optional but recommended)
CREATE INDEX idx_categories_color ON "categories"("color");
CREATE INDEX idx_categories_icon ON "categories"("icon");

-- Update existing categories with default values if they're null
UPDATE "categories" 
SET 
    "color" = '#01C38D' 
WHERE "color" IS NULL;

UPDATE "categories" 
SET 
    "icon" = '📦' 
WHERE "icon" IS NULL; 