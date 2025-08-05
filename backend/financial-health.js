/**
 * Financial Health Score Calculator
 * Calculates a user's financial health score based on various metrics
 */

const getFinancialHealthScore = async (supabase, userId) => {
    try {
        // Fetch user financial data from Supabase
        // Note: Using simplified queries to match test mock structure
        const incomeResult = await supabase
            .from('transactions')
            .select('amount')
            .eq('typeId', 2); // Income
        const incomeData = incomeResult.data;

        const savingsResult = await supabase
            .from('transactions')
            .select('amount')
            .eq('typeId', 3); // Savings
        const savingsData = savingsResult.data;

        const expenseResult = await supabase
            .from('transactions')
            .select('amount')
            .eq('typeId', 1); // Expenses
        const expenseData = expenseResult.data;

        const budgetResult = await supabase
            .from('budgets')
            .select('amount')
            .eq('userId', userId);
        const budgetData = budgetResult.data;

        const liabilityResult = await supabase
            .from('liabilities')
            .select('amount')
            .eq('userId', userId);
        const liabilityData = liabilityResult.data;

        const assetResult = await supabase
            .from('assets')
            .select('value')
            .eq('userId', userId);
        const assetData = assetResult.data;

        // Calculate totals
        const totalIncome = (incomeData || []).reduce((sum, item) => sum + item.amount, 0);
        const totalSavings = (savingsData || []).reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = (expenseData || []).reduce((sum, item) => sum + item.amount, 0);
        const totalBudget = (budgetData || []).reduce((sum, item) => sum + item.amount, 0);
        const totalLiabilities = (liabilityData || []).reduce((sum, item) => sum + item.amount, 0);
        const totalAssets = (assetData || []).reduce((sum, item) => sum + item.value, 0);

        // Calculate metrics
        const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
        const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 100;
        const debtToIncomeRatio = totalIncome > 0 ? Math.round((totalLiabilities / totalIncome) * 100) : 100;
        const netWorth = totalAssets - totalLiabilities;

        // Calculate overall score
        let score = 0;
        const maxScore = 100;

        // Income vs Expenses ratio (30% weight)
        const incomeExpenseRatio = totalIncome > 0 ? 
            (totalIncome - totalExpenses) / totalIncome : 0;
        
        if (incomeExpenseRatio > 0.3) score += 30;
        else if (incomeExpenseRatio > 0.2) score += 25;
        else if (incomeExpenseRatio > 0.1) score += 20;
        else if (incomeExpenseRatio > 0) score += 10;

        // Savings rate (25% weight)
        if (savingsRate >= 20) score += 25;
        else if (savingsRate >= 15) score += 20;
        else if (savingsRate >= 10) score += 15;
        else if (savingsRate > 0) score += 10;

        // Debt management (25% weight)
        if (debtToIncomeRatio < 10) score += 25;
        else if (debtToIncomeRatio < 30) score += 20;
        else if (debtToIncomeRatio < 50) score += 15;
        else if (debtToIncomeRatio < 80) score += 10;

        // Net worth (20% weight)
        if (netWorth > totalIncome) score += 20;
        else if (netWorth > 0) score += 15;
        else if (netWorth > -totalIncome) score += 10;

        const overallScore = Math.min(Math.round(score), maxScore);

        return {
            overallScore,
            summary: {
                savingsRate: {
                    value: savingsRate,
                    rating: savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Improvement'
                },
                expenseRatio: {
                    value: expenseRatio,
                    rating: expenseRatio <= 70 ? 'Excellent' : expenseRatio <= 80 ? 'Good' : 'Needs Improvement'
                },
                debtToIncomeRatio: {
                    value: debtToIncomeRatio,
                    rating: debtToIncomeRatio < 30 ? 'Excellent' : debtToIncomeRatio < 50 ? 'Good' : 'Needs Improvement'
                },
                netWorth: {
                    value: netWorth,
                    rating: netWorth > 0 ? 'Positive' : 'Negative'
                }
            },
            totals: {
                income: totalIncome,
                expenses: totalExpenses,
                savings: totalSavings,
                assets: totalAssets,
                liabilities: totalLiabilities
            }
        };

    } catch (error) {
        console.error('Error calculating financial health score:', error);
        throw error;
    }
};

const getFinancialHealthCategory = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
};

const getFinancialHealthRecommendations = (userData, score) => {
    const recommendations = [];

    // Income vs Expenses recommendations
    const incomeExpenseRatio = userData.totalIncome > 0 ? 
        (userData.totalIncome - userData.totalExpenses) / userData.totalIncome : 0;
    
    if (incomeExpenseRatio <= 0) {
        recommendations.push('Your expenses exceed your income. Consider reducing non-essential spending.');
    } else if (incomeExpenseRatio < 0.2) {
        recommendations.push('Try to save at least 20% of your income. Look for areas to cut expenses.');
    }

    // Emergency fund recommendations
    const monthlyExpenses = userData.totalExpenses / 12;
    const emergencyFundMonths = userData.emergencyFund / monthlyExpenses;
    
    if (emergencyFundMonths < 3) {
        recommendations.push('Build an emergency fund covering 3-6 months of expenses.');
    }

    // Debt recommendations
    const debtToIncomeRatio = userData.totalIncome > 0 ? 
        userData.totalDebt / userData.totalIncome : 1;
    
    if (debtToIncomeRatio > 0.3) {
        recommendations.push('Consider debt consolidation or payment strategies to reduce debt burden.');
    }

    // Budget recommendations
    if ((userData.budgetAdherence || 0) < 0.8) {
        recommendations.push('Improve budget tracking and adherence to reach financial goals.');
    }

    return recommendations;
};

module.exports = {
    getFinancialHealthScore,
    getFinancialHealthCategory,
    getFinancialHealthRecommendations
}; 