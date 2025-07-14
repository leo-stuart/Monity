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
  
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BalanceChart(){
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const { data: months } = await get('/months');
                const balancePromises = months.map(month => get(`/balance/${month}`));
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
    }, []);

    // Sort history by month
    const sortedHistory = [...history].sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/');
        const [bMonth, bYear] = b.month.split('/');
        return (aYear - bYear) || (aMonth - bMonth);
    });

    const labels = sortedHistory.map(item => item.month);
    const balances = sortedHistory.map(item => parseFloat(item.balance));

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Monthly Balance',
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
            title: { display: true, text: 'Monthly Balance Overview' },
        },
    };

    if (loading) {
        return <Spinner message="Loading balance chart..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }
    return (
        <div className="w-full max-w-4xl mx-auto">
            <Bar options={options} data={data}/>
        </div>
    )        
} 

export default BalanceChart