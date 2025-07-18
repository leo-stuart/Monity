async function getExpenseForecast(supabase, userId) {
    console.log(`[getExpenseForecast] Starting for user: ${userId}`);
    const { data: expenses, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('userId', userId)
        .eq('typeId', 1) // typeId 1 for Expense
        .order('date', { ascending: true });

    if (error) {
        console.error('[getExpenseForecast] Error fetching expenses for forecast:', error.message);
        throw new Error('Error fetching expenses for forecast');
    }
    console.log(`[getExpenseForecast] Fetched ${expenses.length} expenses.`);

    if (expenses.length < 2) {
        console.log('[getExpenseForecast] Not enough data to generate a forecast.');
        return { forecast: [], message: 'Not enough historical data to generate a forecast.' };
    }

    const monthlyTotals = {};
    for (const expense of expenses) {
        const date = new Date(expense.date);
        if (isNaN(date.getTime())) {
            console.warn(`[getExpenseForecast] Skipping invalid date format: ${expense.date}`);
            continue;
        }
        const year = date.getFullYear();
        const month = date.getMonth();
        const key = `${year}-${month}`;
        
        if (!monthlyTotals[key]) {
            monthlyTotals[key] = { total: 0, count: 0, year, month };
        }
        monthlyTotals[key].total += expense.amount;
        monthlyTotals[key].count++;
    }

    const series = Object.values(monthlyTotals);
    
    if (series.length < 2) {
        console.log('[getExpenseForecast] Not enough distinct monthly data to generate a forecast.');
        return { forecast: [], message: 'Not enough historical data for a forecast (at least 2 months of data required).' };
    }

    const points = series.map(m => ({
        time: new Date(m.year, m.month).getTime() / 1000,
        value: m.total
    }));
    
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const point of points) {
        sumX += point.time;
        sumY += point.value;
        sumXY += point.time * point.value;
        sumXX += point.time * point.time;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) {
        console.warn('[getExpenseForecast] Cannot calculate forecast: denominator is zero.');
        return { forecast: [], message: 'Cannot generate a forecast with the provided data.' };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const forecast = [];
    const lastDate = new Date(series[n-1].year, series[n-1].month);

    for (let i = 1; i <= 3; i++) {
        const nextMonthDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1);
        const time = nextMonthDate.getTime() / 1000;
        
        const predictedValue = slope * time + intercept;

        forecast.push({
            date: `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`,
            amount: predictedValue.toFixed(2)
        });
    }

    console.log('[getExpenseForecast] Forecast generated successfully.');
    return { forecast };
}

module.exports = { getExpenseForecast }; 