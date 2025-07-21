-- Migration: Add missing columns to existing budgets table
-- The budgets table exists but is missing some columns for our enhanced functionality

-- Add missing columns to budgets table
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS spent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS period VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS "startDate" DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS "endDate" DATE,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have default names if they don't have one
UPDATE public.budgets 
SET name = CONCAT('Budget for ', 
    COALESCE(
        (SELECT name FROM public.categories WHERE id = budgets."categoryId" LIMIT 1), 
        'Unknown Category'
    )
)
WHERE name IS NULL;

-- Update existing records to have a period based on the month column
UPDATE public.budgets 
SET period = 'monthly',
    "startDate" = month,
    "endDate" = (month + INTERVAL '1 month')::DATE
WHERE period IS NULL;

-- Make name column NOT NULL after updating existing records
ALTER TABLE public.budgets 
ALTER COLUMN name SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_userId ON public.budgets("userId");
CREATE INDEX IF NOT EXISTS idx_budgets_categoryId ON public.budgets("categoryId");
CREATE INDEX IF NOT EXISTS idx_budgets_period ON public.budgets(period);
CREATE INDEX IF NOT EXISTS idx_budgets_isActive ON public.budgets("isActive");

-- Create or replace the updatedAt trigger function
CREATE OR REPLACE FUNCTION update_budgets_updatedAt()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updatedAt
DROP TRIGGER IF EXISTS update_budgets_updatedAt_trigger ON public.budgets;
CREATE TRIGGER update_budgets_updatedAt_trigger
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE PROCEDURE update_budgets_updatedAt();

-- Function to calculate budget end date based on period and start date
CREATE OR REPLACE FUNCTION calculate_budget_end_date()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.period
        WHEN 'weekly' THEN
            NEW."endDate" = NEW."startDate" + INTERVAL '1 week';
        WHEN 'monthly' THEN
            NEW."endDate" = NEW."startDate" + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            NEW."endDate" = NEW."startDate" + INTERVAL '3 months';
        WHEN 'yearly' THEN
            NEW."endDate" = NEW."startDate" + INTERVAL '1 year';
        ELSE
            NEW."endDate" = NEW."startDate" + INTERVAL '1 month';
    END CASE;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically set end_date
DROP TRIGGER IF EXISTS set_budget_end_date ON public.budgets;
CREATE TRIGGER set_budget_end_date
    BEFORE INSERT OR UPDATE ON public.budgets
    FOR EACH ROW EXECUTE PROCEDURE calculate_budget_end_date(); 