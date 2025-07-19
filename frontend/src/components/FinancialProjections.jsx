import React, { useState } from 'react';
import api from '../utils/api';

const FinancialProjections = ({ goal }) => {
    const [extraSavings, setExtraSavings] = useState('');
    const [projection, setProjection] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleProjection = async () => {
        if (!extraSavings || parseFloat(extraSavings) <= 0) {
            alert('Please enter a valid amount to add to your savings.');
            return;
        }

        setLoading(true);
        try {
            const projectionData = await api.post('/financial-projections', {
                goalId: goal.id,
                extraMonthlySavings: parseFloat(extraSavings),
            });
            setProjection(projectionData.data);
        } catch (error) {
            console.error('Error calculating projection:', error);
            alert('Failed to calculate projection. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">“What-If” Scenario Planner</h3>
            <p className="mb-4">See how extra savings can impact your goal: <strong>{goal.goal_name}</strong></p>

            <div className="mb-4">
                <label htmlFor="extra-savings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra monthly savings ($)</label>
                <input
                    type="number"
                    id="extra-savings"
                    value={extraSavings}
                    onChange={(e) => setExtraSavings(e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            <button
                onClick={handleProjection}
                disabled={loading}
                className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
                {loading ? 'Calculating...' : 'Calculate Projection'}
            </button>

            {projection && (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-bold text-lg">AI-Powered Projection Results</h4>
                    
                    <div className="my-4">
                        <p>Based on your transaction history, we predict you can save an average of <strong className="text-blue-500">${projection.predictedMonthlySavings}</strong> per month.</p>
                        <p>With your extra commitment of <strong className="text-blue-500">${extraSavings}</strong>, your total monthly savings could be <strong className="text-blue-500">${(parseFloat(projection.predictedMonthlySavings) + parseFloat(extraSavings)).toFixed(2)}</strong>.</p>
                    </div>

                    <p>With this pace, you could reach your goal on:</p>
                    <p className="text-2xl font-bold text-green-500">{projection.projectedDate}</p>
                    <p>That's approximately <strong>{projection.monthsToReachGoal} months</strong> from now, and <strong>{projection.daysSooner} days sooner</strong> than your original target date!</p>
                </div>
            )}
        </div>
    );
};

export default FinancialProjections; 