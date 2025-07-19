async function calculateProjection(goal, extraMonthlySavings) {
    const remainingAmount = goal.target_amount - goal.current_amount;
    if (remainingAmount <= 0) {
        return {
            projectedDate: new Date().toLocaleDateString(),
            monthsToReachGoal: 0,
            daysSooner: 0,
        };
    }

    const monthsToReachGoal = remainingAmount / extraMonthlySavings;
    
    const originalTargetDate = new Date(goal.target_date);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsToReachGoal);

    const timeDifference = originalTargetDate.getTime() - projectedDate.getTime();
    const daysSooner = Math.ceil(timeDifference / (1000 * 3600 * 24));

    return {
        projectedDate: projectedDate.toLocaleDateString(),
        monthsToReachGoal: Math.ceil(monthsToReachGoal),
        daysSooner: daysSooner > 0 ? daysSooner : 0,
    };
}

module.exports = {
    calculateProjection,
}; 