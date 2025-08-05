// Savings Goal functions
const EncryptionMiddleware = require('./security/encryptionMiddleware');

async function addGoal(supabase, userId, goal_name, target_amount, target_date, current_amount) {
  const goalData = { user_id: userId, goal_name, target_amount, target_date, current_amount };
  
  // Encrypt sensitive data before inserting
  const encryptedGoalData = EncryptionMiddleware.encryptForInsert('savings_goals', goalData);
  
  const { data, error } = await supabase.from('savings_goals').insert([encryptedGoalData]).select();
  if (error) throw new Error(error.message);
  
  // Decrypt the created goal for response
  const decryptedGoal = EncryptionMiddleware.decryptFromSelect('savings_goals', data[0]);
  
  return decryptedGoal;
}

async function getGoals(supabase, userId) {
    const { data, error } = await supabase.from('savings_goals').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);
    
    // Decrypt sensitive data before returning
    const decryptedGoals = EncryptionMiddleware.decryptFromSelect('savings_goals', data || []);
    
    return decryptedGoals;
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