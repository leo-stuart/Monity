import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../utils/api';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from 'recharts';

const FinancialHealthScore = () => {
    const { t } = useTranslation();
    const [scoreData, setScoreData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const res = await apiClient.get('/premium/financial-health-score');
                setScoreData(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchScore();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!scoreData) return null;

    const style = {
        top: 0,
        left: 'auto',
        right: 0,
        lineHeight: '24px'
    };
    
    const data = [{ name: 'Score', uv: scoreData.overallScore, fill: '#8884d8' }];

    return (
        <div className="p-4 md:p-6 bg-[#23263a] rounded-xl shadow-lg text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-4">{t('premium.financial_health_title')}</h2>
            <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="10%" 
                    outerRadius="80%" 
                    barSize={10} 
                    data={data}
                    startAngle={180}
                    endAngle={0}
                >
                    <RadialBar
                        minAngle={15}
                        label={{ position: 'insideStart', fill: '#fff' }}
                        background
                        clockWise
                        dataKey='uv' 
                    />
                    <Legend iconSize={10} width={120} height={140} layout='vertical' verticalAlign='middle' wrapperStyle={style} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="mt-4">
                <h3 className="text-lg font-bold">Score Breakdown</h3>
                <ul>
                    <li className="flex justify-between py-1">
                        <span>Savings Rate ({ scoreData.summary.savingsRate.value.toFixed(0) }%)</span>
                        <span className="font-bold">{ scoreData.summary.savingsRate.score.toFixed(0) }/100</span>
                    </li>
                    <li className="flex justify-between py-1">
                        <span>Budget Adherence ({ scoreData.summary.budgetAdherence.value.toFixed(0) }%)</span>
                        <span className="font-bold">{ scoreData.summary.budgetAdherence.score.toFixed(0) }/100</span>
                    </li>
                    <li className="flex justify-between py-1">
                        <span>Debt-to-Income Ratio ({ scoreData.summary.debtToIncomeRatio.value.toFixed(0) }%)</span>
                        <span className="font-bold">{ scoreData.summary.debtToIncomeRatio.score.toFixed(0) }/100</span>
                    </li>
                    <li className="flex justify-between py-1">
                        <span>Emergency Fund ({ scoreData.summary.emergencyFund.value.toFixed(1) } months)</span>
                        <span className="font-bold">{ scoreData.summary.emergencyFund.score.toFixed(0) }/100</span>
                    </li>
                    <li className="flex justify-between py-1">
                        <span>Investment Rate ({ scoreData.summary.investmentRate.value.toFixed(0) }%)</span>
                        <span className="font-bold">{ scoreData.summary.investmentRate.score.toFixed(0) }/100</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default FinancialHealthScore; 