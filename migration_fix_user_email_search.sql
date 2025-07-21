-- Migration to fix user email search in group invitations
-- This script updates the handle_new_user function to populate email and backfills existing users

-- 1. Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, subscription_tier)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,  -- Add the email from auth.users
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    'free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill email addresses for existing users
-- This updates all existing profiles with their email from auth.users
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE profiles.id = auth_users.id 
  AND profiles.email IS NULL; 