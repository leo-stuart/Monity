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

        fetch('http://localhost:3000/monthly-history', {
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
            .then(data => {
                setHistory(data.data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    const labels = history.map(item => item.month);
    const balances = history.map(item => parseFloat(item.balance));

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