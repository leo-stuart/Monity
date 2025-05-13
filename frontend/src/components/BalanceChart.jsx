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
import { getToken } from '../utils/api';
  
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function BalanceChart(){
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        fetch('http://localhost:3000/months', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status ${response.status}`);
                }
                return response.json();
            })
            .then(months => {
                // Fetch balance data for each month
                fetchBalanceData(months, token);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // Function to fetch balance data for each month
    const fetchBalanceData = async (months, token) => {
        try {
            const monthlyBalances = [];
            
            for (const month of months) {
                const response = await fetch(`http://localhost:3000/balance/${month}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status ${response.status}`);
                }
                
                const data = await response.json();
                monthlyBalances.push({
                    month,
                    balance: data.balance || 0
                });
            }
            
            setHistory(monthlyBalances);
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

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