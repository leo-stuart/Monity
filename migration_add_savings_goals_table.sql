CREATE TABLE savings_goals (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    goal_name TEXT NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    current_amount NUMERIC(10, 2) DEFAULT 0.00,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for the savings_goals table
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own savings goals
CREATE POLICY "Allow individual read access"
ON public.savings_goals FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to add their own savings goals
CREATE POLICY "Allow individual insert access"
ON public.savings_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own savings goals
CREATE POLICY "Allow individual update access"
ON public.savings_goals FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own savings goals
CREATE POLICY "Allow individual delete access"
ON public.savings_goals FOR DELETE
USING (auth.uid() = user_id); 