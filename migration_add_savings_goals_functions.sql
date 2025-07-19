-- Function to allocate funds to a savings goal and create a corresponding expense transaction
CREATE OR REPLACE FUNCTION allocate_to_goal(
    goal_id_to_update BIGINT,
    allocation_amount NUMERIC,
    auth_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    goal_record RECORD;
BEGIN
    -- Find the goal to ensure it belongs to the user
    SELECT * INTO goal_record FROM public.savings_goals WHERE id = goal_id_to_update AND user_id = auth_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Savings goal not found or user does not have permission';
    END IF;

    -- Create an expense transaction for the allocation
    INSERT INTO public.transactions("userId", "typeId", category, amount, description, date)
    VALUES (auth_user_id, 1, 'Savings Goals', allocation_amount, 'Allocation to goal: ' || goal_record.goal_name, NOW());

    -- Update the current amount of the goal
    UPDATE public.savings_goals
    SET current_amount = current_amount + allocation_amount
    WHERE id = goal_id_to_update;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a savings goal and refund the balance by creating an income transaction
CREATE OR REPLACE FUNCTION delete_savings_goal(
    goal_id_to_delete BIGINT,
    auth_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    goal_record RECORD;
BEGIN
    -- Find the goal to ensure it belongs to the user
    SELECT * INTO goal_record FROM public.savings_goals WHERE id = goal_id_to_delete AND user_id = auth_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Savings goal not found or user does not have permission';
    END IF;

    -- If there is money in the goal, create a refund (income) transaction
    IF goal_record.current_amount > 0 THEN
        INSERT INTO public.transactions("userId", "typeId", category, amount, description, date)
        VALUES (auth_user_id, 2, 'Savings Goals', goal_record.current_amount, 'Refund from goal: ' || goal_record.goal_name, NOW());
    END IF;

    -- Delete the savings goal
    DELETE FROM public.savings_goals WHERE id = goal_id_to_delete;
END;
$$ LANGUAGE plpgsql; 