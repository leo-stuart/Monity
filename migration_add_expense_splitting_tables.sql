-- migration_add_expense_splitting_tables.sql

-- Create the groups table to store information about each group.
CREATE TABLE "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Create the group_members table to manage the members of each group.
CREATE TABLE "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);

-- Create the group_expenses table to track expenses associated with a group.
CREATE TABLE "public"."group_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" "numeric" NOT NULL,
    "paid_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Create the expense_shares table to break down who owes what for each expense.
CREATE TABLE "public"."expense_shares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expense_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount_owed" "numeric" NOT NULL,
    "is_settled" boolean DEFAULT false
);

-- Set up primary and foreign keys
ALTER TABLE ONLY "public"."expense_shares"
    ADD CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."expense_shares"
    ADD CONSTRAINT "expense_shares_expense_id_user_id_key" UNIQUE ("expense_id", "user_id");
ALTER TABLE ONLY "public"."group_expenses"
    ADD CONSTRAINT "group_expenses_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");
ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");

-- Foreign key constraints
ALTER TABLE ONLY "public"."expense_shares"
    ADD CONSTRAINT "expense_shares_expense_id_fkey" FOREIGN KEY (expense_id) REFERENCES public.group_expenses(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."expense_shares"
    ADD CONSTRAINT "expense_shares_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."group_expenses"
    ADD CONSTRAINT "group_expenses_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."group_expenses"
    ADD CONSTRAINT "group_expenses_paid_by_fkey" FOREIGN KEY (paid_by) REFERENCES auth.users(id);
ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);


-- Function to check if a user is a member of a group
CREATE OR REPLACE FUNCTION is_member_of_group(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = p_user_id
  );
END;
$$;


-- Row Level Security (RLS) policies
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see groups they are a member of" ON "public"."groups" FOR SELECT USING (is_member_of_group(id, auth.uid()));
CREATE POLICY "Allow authenticated users to create groups" ON "public"."groups" FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow group creator to update group" ON "public"."groups" FOR UPDATE USING ((created_by = auth.uid()));
CREATE POLICY "Allow group creator to delete group" ON "public"."groups" FOR DELETE USING ((created_by = auth.uid()));

ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow group members to see other members" ON "public"."group_members" FOR SELECT USING (is_member_of_group(group_id, auth.uid()));
CREATE POLICY "Allow group creator to add members" ON "public"."group_members" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "public"."groups" WHERE (("groups".id = group_members.group_id) AND ("groups".created_by = auth.uid()))));
CREATE POLICY "Allow users to leave groups, or creator to remove them" ON "public"."group_members" FOR DELETE USING (((user_id = auth.uid()) OR (EXISTS (SELECT 1 FROM "public"."groups" WHERE (("groups".id = group_members.group_id) AND ("groups".created_by = auth.uid()))))));

ALTER TABLE "public"."group_expenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow group members to see expenses" ON "public"."group_expenses" FOR SELECT USING (is_member_of_group(group_id, auth.uid()));
CREATE POLICY "Allow group members to add expenses" ON "public"."group_expenses" FOR INSERT WITH CHECK (is_member_of_group(group_id, auth.uid()));
CREATE POLICY "Allow payer to update expense" ON "public"."group_expenses" FOR UPDATE USING ((paid_by = auth.uid()));
CREATE POLICY "Allow payer to delete expense" ON "public"."group_expenses" FOR DELETE USING ((paid_by = auth.uid()));

ALTER TABLE "public"."expense_shares" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow group members to see expense shares" ON "public"."expense_shares" FOR SELECT USING ((EXISTS (SELECT 1 FROM "public".group_expenses ge WHERE ((ge.id = expense_shares.expense_id) AND is_member_of_group(ge.group_id, auth.uid())))));
CREATE POLICY "Allow users to update their own settlement status or payer to update" ON "public"."expense_shares" FOR UPDATE USING (((user_id = auth.uid()) OR (EXISTS (SELECT 1 FROM "public".group_expenses ge WHERE ((ge.id = expense_shares.expense_id) AND (ge.paid_by = auth.uid()))))));
CREATE POLICY "Allow group members to create shares" ON "public"."expense_shares" FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM "public".group_expenses ge WHERE ((ge.id = expense_shares.expense_id) AND is_member_of_group(ge.group_id, auth.uid()))));
CREATE POLICY "Allow group members to delete shares" ON "public"."expense_shares" FOR DELETE USING (EXISTS (SELECT 1 FROM "public".group_expenses ge WHERE ((ge.id = expense_shares.expense_id) AND is_member_of_group(ge.group_id, auth.uid()))));


-- Trigger function to automatically add creator to group members
CREATE OR REPLACE FUNCTION add_creator_to_group()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$;

-- Trigger to add creator to group members
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_to_group(); 

-- Add group invitations table
CREATE TABLE "public"."group_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "invited_user" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone
);

-- Set up primary and foreign keys for invitations
ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_group_id_invited_user_key" UNIQUE ("group_id", "invited_user");

-- Foreign key constraints for invitations
ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_invited_user_fkey" FOREIGN KEY (invited_user) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add email column to profiles if it doesn't exist (for user search)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE "public"."profiles" ADD COLUMN "email" "text";
    END IF;
END $$;

-- RLS policies for group invitations
ALTER TABLE "public"."group_invitations" ENABLE ROW LEVEL SECURITY;

-- Users can see invitations sent to them or sent by them
CREATE POLICY "Users can see their invitations" ON "public"."group_invitations" 
    FOR SELECT USING ((invited_user = auth.uid()) OR (invited_by = auth.uid()));

-- Group creators and members can send invitations
CREATE POLICY "Group members can send invitations" ON "public"."group_invitations" 
    FOR INSERT WITH CHECK (
        invited_by = auth.uid() AND 
        (is_member_of_group(group_id, auth.uid()) OR 
         EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()))
    );

-- Users can update their own invitation responses
CREATE POLICY "Users can respond to invitations" ON "public"."group_invitations" 
    FOR UPDATE USING (invited_user = auth.uid());

-- Function to automatically add user to group when invitation is accepted
CREATE OR REPLACE FUNCTION handle_invitation_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If invitation was accepted, add user to group
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.group_members (group_id, user_id)
        VALUES (NEW.group_id, NEW.invited_user)
        ON CONFLICT (group_id, user_id) DO NOTHING;
        
        -- Update responded_at timestamp
        NEW.responded_at = now();
    END IF;
    
    -- If invitation was declined, just update timestamp
    IF NEW.status = 'declined' AND OLD.status = 'pending' THEN
        NEW.responded_at = now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for invitation responses
CREATE TRIGGER on_invitation_response
    BEFORE UPDATE ON public.group_invitations
    FOR EACH ROW
    EXECUTE FUNCTION handle_invitation_response();

-- Function to get user pending invitations count
CREATE OR REPLACE FUNCTION get_pending_invitations_count(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.group_invitations
        WHERE invited_user = user_id AND status = 'pending'
    );
END;
$$; 