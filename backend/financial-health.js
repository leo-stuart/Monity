async function getFinancialHealthScore(supabase, userId) {
  console.log(`[FinancialHealthScore] Starting for user: ${userId}`);
  
  // 1. Savings Rate (target: 15-20%)
  const { data: incomeData, error: incomeError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('userId', userId)
    .eq('typeId', 2); // typeId 2 for Income
  
  const { data: savingsData, error: savingsError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('userId', userId)
    .eq('typeId', 3); // typeId 3 for Savings

  if (incomeError || savingsError) {
    console.error('[FinancialHealthScore] Error fetching income/savings data:', incomeError?.message || savingsError?.message);
    throw new Error(incomeError?.message || savingsError?.message);
  }
  
  const totalIncome = incomeData.reduce((acc, t) => acc + t.amount, 0);
  const totalSavings = savingsData.reduce((acc, t) => acc + t.amount, 0);
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  const savingsScore = Math.min((savingsRate / 20) * 100, 100); // Max score at 20%
  console.log(`[FinancialHealthScore] Savings Rate: ${savingsRate}%, Score: ${savingsScore}`);

  // 2. Budget Adherence (target: 100% or less)
  const { data: budgetData, error: budgetError } = await supabase
    .from('budgets')
    .select('amount, categoryId')
    .eq('userId', userId);

  const { data: expenseData, error: expenseError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('userId', userId)
    .eq('typeId', 1); // typeId 1 for Expense

  if (budgetError || expenseError) {
    console.error('[FinancialHealthScore] Error fetching budget/expense data:', budgetError?.message || expenseError?.message);
    throw new Error(budgetError?.message || expenseError?.message);
  }

  const totalBudget = budgetData.reduce((acc, b) => acc + b.amount, 0);
  const totalExpenses = expenseData.reduce((acc, t) => acc + t.amount, 0);
  const budgetAdherence = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 100;
  const budgetScore = Math.max(100 - (budgetAdherence - 100), 0); // Score decreases as you go over budget
  console.log(`[FinancialHealthScore] Budget Adherence: ${budgetAdherence}%, Score: ${budgetScore}`);

  // 3. Debt-to-Income Ratio (target: < 36%)
  const { data: liabilitiesData, error: liabilitiesError } = await supabase
    .from('liabilities')
    .select('amount')
    .eq('user_id', userId);

  if (liabilitiesError) {
    console.error('[FinancialHealthScore] Error fetching liabilities data:', liabilitiesError.message);
    throw new Error(liabilitiesError.message);
  }
  const totalLiabilities = liabilitiesData.reduce((acc, l) => acc + l.amount, 0);
  const debtToIncomeRatio = totalIncome > 0 ? (totalLiabilities / (totalIncome * 12)) * 100 : 0; // Annualized
  let debtScore = 0;
  if (debtToIncomeRatio < 15) {
    debtScore = 100;
  } else if (debtToIncomeRatio <= 36) {
    debtScore = 100 - ((debtToIncomeRatio - 15) / (36 - 15)) * 50;
  } else if (debtToIncomeRatio <= 43) {
    debtScore = 50 - ((debtToIncomeRatio - 36) / (43 - 36)) * 25;
  } else {
    debtScore = 25 - Math.min((debtToIncomeRatio - 43) / 10, 1) * 25;
  }
  console.log(`[FinancialHealthScore] Debt-to-Income Ratio: ${debtToIncomeRatio}%, Score: ${debtScore}`);

  // 4. Emergency Fund (target: 3-6 months of expenses)
  const monthlyExpenses = totalExpenses;
  const { data: cashData, error: cashError } = await supabase
    .from('assets')
    .select('value')
    .eq('user_id', userId)
    .eq('type', 'Cash');

  if (cashError) {
    console.error('[FinancialHealthScore] Error fetching cash data:', cashError.message);
    throw new Error(cashError.message);
  }

  const totalCash = cashData.reduce((acc, a) => acc + a.value, 0);
  const emergencyFundInMonths = monthlyExpenses > 0 ? totalCash / monthlyExpenses : 6;
  let emergencyFundScore = 0;
  if (emergencyFundInMonths >= 6) {
    emergencyFundScore = 100;
  } else if (emergencyFundInMonths >= 3) {
    emergencyFundScore = (emergencyFundInMonths / 3) * 50;
  } else {
    emergencyFundScore = (emergencyFundInMonths / 3) * 50;
  }
  console.log(`[FinancialHealthScore] Emergency Fund: ${emergencyFundInMonths} months, Score: ${emergencyFundScore}`);

  // 5. Investment Rate (target: 10-15% of income)
  // Re-use totalSavings from the first step, assuming savings are used for investments.
  const totalInvestments = totalSavings; 
  const investmentRate = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  let investmentScore = 0;
  if (investmentRate >= 15) {
    investmentScore = 100;
  } else if (investmentRate >= 10) {
    investmentScore = 50 + ((investmentRate - 10) / 5) * 50;
  } else {
    investmentScore = (investmentRate / 10) * 50;
  }
  console.log(`[FinancialHealthScore] Investment Rate: ${investmentRate}%, Score: ${investmentScore}`);

  // Weights for each component
  const weights = {
    savingsRate: 0.25,
    budgetAdherence: 0.25,
    debtToIncomeRatio: 0.20,
    emergencyFund: 0.15,
    investmentRate: 0.15
  };

  const overallScore =
    (savingsScore * weights.savingsRate) +
    (budgetScore * weights.budgetAdherence) +
    (debtScore * weights.debtToIncomeRatio) +
    (emergencyFundScore * weights.emergencyFund) +
    (investmentScore * weights.investmentRate);
  console.log(`[FinancialHealthScore] Overall Score: ${overallScore}`);

  return {
    overallScore: Math.round(overallScore),
    summary: {
      savingsRate: {
        value: savingsRate,
        score: Math.round(savingsScore)
      },
      budgetAdherence: {
        value: budgetAdherence,
        score: Math.round(budgetScore)
      },
      debtToIncomeRatio: {
        value: debtToIncomeRatio,
        score: Math.round(debtScore)
      },
      emergencyFund: {
        value: emergencyFundInMonths,
        score: Math.round(emergencyFundScore)
      },
      investmentRate: {
        value: investmentRate,
        score: Math.round(investmentScore)
      }
    }
  };
}

module.exports = {
  getFinancialHealthScore
}; 