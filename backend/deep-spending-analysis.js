async function getDeepSpendingAnalysis(supabase, userId) {
  console.log(`[DeepSpendingAnalysis] Starting for user: ${userId}`);
  const { data: expenses, error } = await supabase
    .from('transactions')
    .select('amount, category, date')
    .eq('userId', userId)
    .eq('typeId', 1); // typeId 1 for Expense

  if (error) {
    console.error('[DeepSpendingAnalysis] Error fetching expenses:', error.message);
    throw new Error('Error fetching expenses');
  }
  console.log(`[DeepSpendingAnalysis] Fetched ${expenses.length} expenses.`);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlySpending = {};

  for (const expense of expenses) {
    const expenseDate = new Date(expense.date);
    const month = expenseDate.getMonth();
    const year = expenseDate.getFullYear();
    const category = expense.category || 'Uncategorized';

    const monthKey = `${year}-${month}`;
    if (!monthlySpending[monthKey]) {
      monthlySpending[monthKey] = {};
    }
    if (!monthlySpending[monthKey][category]) {
      monthlySpending[monthKey][category] = 0;
    }
    monthlySpending[monthKey][category] += expense.amount;
  }

  const currentMonthKey = `${currentYear}-${currentMonth}`;
  const currentMonthSpending = monthlySpending[currentMonthKey] || {};

  const averageSpending = {};
  const monthCounts = {};

  for (const monthKey in monthlySpending) {
    if (monthKey === currentMonthKey) continue;

    for (const category in monthlySpending[monthKey]) {
      if (!averageSpending[category]) {
        averageSpending[category] = 0;
        monthCounts[category] = 0;
      }
      averageSpending[category] += monthlySpending[monthKey][category];
      monthCounts[category]++;
    }
  }

  for (const category in averageSpending) {
    averageSpending[category] /= monthCounts[category];
  }

  const analysis = [];
  for (const category in currentMonthSpending) {
    if (averageSpending[category]) {
      const current = currentMonthSpending[category];
      const average = averageSpending[category];
      const difference = current - average;
      const percentageChange = (difference / average) * 100;

      if (percentageChange > 20) { // Alert if spending is 20% over average
        analysis.push({
          category,
          current,
          average,
          percentageChange,
          message: `You've spent ${percentageChange.toFixed(0)}% more on ${category} this month compared to your average.`,
        });
      }
    }
  }

  console.log('[DeepSpendingAnalysis] Analysis complete:', analysis);
  return { analysis };
}

async function detectRecurringSubscriptions(supabase, userId) {
  console.log(`[detectRecurringSubscriptions] Starting for user: ${userId}`);
  const { data: expenses, error } = await supabase
    .from('transactions')
    .select('description, amount, date')
    .eq('userId', userId)
    .eq('typeId', 1) // typeId 1 for Expense
    .order('date', { ascending: false });

  if (error) {
    console.error('[detectRecurringSubscriptions] Error fetching expenses:', error.message);
    throw new Error('Error fetching expenses for subscription detection');
  }
  console.log(`[detectRecurringSubscriptions] Fetched ${expenses.length} expenses.`);

  const recurring = {};
  const potentialSubscriptions = [];

  for (const expense of expenses) {
    const key = `${expense.description}-${expense.amount}`;
    if (!recurring[key]) {
      recurring[key] = [];
    }
    recurring[key].push(new Date(expense.date));
  }

  for (const key in recurring) {
    if (recurring[key].length > 1) {
      const dates = recurring[key];
      const intervals = [];
      for (let i = 0; i < dates.length - 1; i++) {
        const diffTime = Math.abs(dates[i] - dates[i+1]);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }

      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      // Check for monthly-like intervals (28-32 days)
      if (averageInterval >= 28 && averageInterval <= 32) {
        const [description, amount] = key.split('-');
        potentialSubscriptions.push({
          description,
          amount: parseFloat(amount),
          count: recurring[key].length,
          averageInterval,
          message: `We've detected a potential recurring subscription for "${description}" of $${amount}.`
        });
      }
    }
  }

  console.log('[detectRecurringSubscriptions] Detections complete:', potentialSubscriptions);
  return { potentialSubscriptions };
}

async function detectDuplicateTransactions(supabase, userId) {
  console.log(`[detectDuplicateTransactions] Starting for user: ${userId}`);
  const { data: expenses, error } = await supabase
    .from('transactions')
    .select('id, description, amount, date')
    .eq('userId', userId)
    .eq('typeId', 1) // typeId 1 for Expense
    .order('date', { ascending: true });

  if (error) {
    console.error('[detectDuplicateTransactions] Error fetching expenses:', error.message);
    throw new Error('Error fetching expenses for duplicate detection');
  }
  console.log(`[detectDuplicateTransactions] Fetched ${expenses.length} expenses.`);

  const potentialDuplicates = [];
  for (let i = 1; i < expenses.length; i++) {
    const prev = expenses[i-1];
    const current = expenses[i];

    const timeDiff = new Date(current.date).getTime() - new Date(prev.date).getTime();
    const timeDiffMinutes = timeDiff / (1000 * 60);

    if (
      current.description === prev.description &&
      current.amount === prev.amount &&
      timeDiffMinutes < 2 // 2 minute window for duplicates
    ) {
      potentialDuplicates.push({
        ...current,
        message: `Potential duplicate of transaction on ${new Date(prev.date).toLocaleString()}`
      });
    }
  }
  
  console.log('[detectDuplicateTransactions] Detections complete:', potentialDuplicates);
  return { potentialDuplicates };
}

module.exports = { getDeepSpendingAnalysis, detectRecurringSubscriptions, detectDuplicateTransactions }; 