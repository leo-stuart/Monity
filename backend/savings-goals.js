// Savings Goal functions
async function addGoal(supabase, userId, goal_name, target_amount, target_date, current_amount) {
  const { data, error } = await supabase.from('savings_goals').insert([{ user_id: userId, goal_name, target_amount, target_date, current_amount }]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

async function getGoals(supabase, userId) {
    const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data;
}

async function allocateToGoal(supabase, goalId, amount, userId) {
    const { error } = await supabase.rpc('allocate_to_goal', {
        goal_id_to_update: goalId,
        allocation_amount: amount,
        auth_user_id: userId
    });
    if (error) throw new Error(error.message);
    return { message: 'Allocation successful' };
}

async function deleteGoal(supabase, goalId, userId) {
    const { error } = await supabase.rpc('delete_savings_goal', {
        goal_id_to_delete: goalId,
        auth_user_id: userId
    });
    if (error) throw new Error(error.message);
    return { message: 'Savings goal deleted successfully' };
}

module.exports = {
    addGoal,
    getGoals,
    allocateToGoal,
    deleteGoal
}; 