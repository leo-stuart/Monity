-- This script updates your existing database to support subscription tiers.
-- You can run this in the Supabase SQL Editor for your project.

-- Add the subscription_tier column to the profiles table.
-- We use IF NOT EXISTS to make the script runnable multiple times without error.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- Backfill the subscription_tier for all existing users to 'free'.
-- This ensures that current users are placed on the free plan.
UPDATE public.profiles
SET subscription_tier = 'free'
WHERE subscription_tier IS NULL;

-- This function is triggered when a new user signs up.
-- We are updating it to:
-- 1. Set the default subscription_tier to 'free'.
-- 2. Ensure that if a role is not provided on signup, it defaults to 'user'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, subscription_tier)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    'free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 