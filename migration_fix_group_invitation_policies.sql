-- Migration to fix RLS policies for group invitations
-- This allows users to see group and profile information when they have pending invitations

-- 1. Update the groups RLS policy to allow users to see groups they are invited to
DROP POLICY IF EXISTS "Allow users to see groups they are a member of" ON "public"."groups";
CREATE POLICY "Allow users to see groups they are a member of or invited to" ON "public"."groups" 
    FOR SELECT USING (
        is_member_of_group(id, auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM public.group_invitations 
            WHERE group_id = id AND invited_user = auth.uid()
        )
    );

-- 2. Update the profiles RLS policy to allow broader access for group functionality
DROP POLICY IF EXISTS "Allow individual read access to profiles" ON "public"."profiles";
CREATE POLICY "Allow read access to profiles" ON "public"."profiles" 
    FOR SELECT USING (
        auth.uid() = "id" OR  -- Users can see their own profile
        EXISTS (
            SELECT 1 FROM public.group_invitations 
            WHERE invited_by = "id" AND invited_user = auth.uid()
        ) OR  -- Users can see profiles of people who invited them
        EXISTS (
            SELECT 1 FROM public.group_invitations 
            WHERE invited_user = "id" AND invited_by = auth.uid()
        ) OR  -- Users can see profiles of people they invited
        EXISTS (
            SELECT 1 FROM public.group_members gm1 
            JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id 
            WHERE gm1.user_id = auth.uid() AND gm2.user_id = "id"
        ) OR  -- Users can see profiles of other group members
        auth.role() = 'authenticated'  -- Allow all authenticated users to search for profiles (for invitations)
    ); 