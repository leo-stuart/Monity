-- Migration to fix group creation RLS policy issue
-- This addresses the issue where users can't see groups they just created due to RLS timing

-- 1. Drop the existing policy for group selection
DROP POLICY IF EXISTS "Allow users to see groups they are a member of or invited to" ON "public"."groups";

-- 2. Create a new policy that allows users to see groups they created OR are members of OR are invited to
CREATE POLICY "Allow users to see groups they created, are members of, or invited to" ON "public"."groups" 
    FOR SELECT USING (
        created_by = auth.uid() OR  -- Users can always see groups they created
        is_member_of_group(id, auth.uid()) OR  -- Users can see groups they are members of
        EXISTS (
            SELECT 1 FROM public.group_invitations 
            WHERE group_id = id AND invited_user = auth.uid()
        )  -- Users can see groups they are invited to
    );

-- 3. Ensure the INSERT policy allows authenticated users to create groups
DROP POLICY IF EXISTS "Allow authenticated users to create groups" ON "public"."groups";
CREATE POLICY "Allow authenticated users to create groups" ON "public"."groups" 
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid()  -- Users can only create groups with themselves as creator
    );

-- 4. Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION add_creator_to_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add the creator to group members
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (NEW.id, NEW.created_by)
  ON CONFLICT (group_id, user_id) DO NOTHING;  -- Prevent duplicate entries
  
  RETURN NEW;
END;
$$;

-- 5. Recreate the trigger to ensure it fires correctly
DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_to_group(); 