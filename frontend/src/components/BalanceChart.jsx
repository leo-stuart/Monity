import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from "chart.js";
import Spinner from './Spinner';
import { get } from '../utils/api';
import { useTranslation } from 'react-i18next';
  
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BalanceChart({ selectedRange }){
    const { t } = useTranslation();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (selectedRange === 'current_month') {
            setLoading(false);
            return;
        };

        const fetchChartData = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: months } = await get('/months');
                if (!months || !months.length) {
                    setHistory([]);
                    setLoading(false);
                    return;
                }
                const balancePromises = months.map(monthStr => {
                    const [year, month] = monthStr.split('/');
                    return get(`/balance/${year}/${month}`);
                });

                const balanceResponses = await Promise.all(balancePromises);

                const monthlyBalances = balanceResponses.map((response, index) => ({
                    month: months[index],
                    balance: response.data.balance || 0
                }));
                
                setHistory(monthlyBalances);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchChartData();
    }, [selectedRange, t]);

    if (loading) {
        return <Spinner message={t('balanceChart.loading')} />
    }
    if (error) {
        return <p className="text-red-500">{t('balanceChart.error', { error })}</p>
    }
    if (selectedRange === 'current_month') {
        return <p className="text-center text-gray-400">{t('balanceChart.allTimeMessage')}</p>;
    }
    
    // Sort history by month
    const sortedHistory = [...history].sort((a, b) => {
        const [aYear, aMonth] = a.month.split('/');
        const [bYear, bMonth] = b.month.split('/');
        return (aYear - bYear) || (aMonth - bMonth);
    });

    const labels = sortedHistory.map(item => {
        const [year, month] = item.month.split('/');
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
        return `${monthName} ${year}`;
    });
    const balances = sortedHistory.map(item => parseFloat(item.balance));

    const data = {
        labels: labels,
        datasets: [
            {
                label: t('balanceChart.monthlyBalance'),
                data: balances,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                borderRadius: 4,

            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: t('balanceChart.title') },
        },
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Bar options={options} data={data}/>
        </div>
    )        
} 

export default BalanceChart