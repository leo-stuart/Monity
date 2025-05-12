import Spinner from "./Spinner"
import { Doughnut } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function ExpenseChart(){
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3000/list-expenses')
        .then(response => {
            if(!response.ok){
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
    
        .then(data => {
            setExpenses(data.data);
            setLoading(false);
        })
        .catch(error => {
            setError(error.message);
            setLoading(false);
        })
    }, []);

    if(loading){
        return <Spinner message="Loading expenses by category chart ..." />
    }
    if(error){
        return <p>Error: {error}</p>
    }

    // Calculate totals by category
    const categoryTotals = expenses.reduce((acc, expense) => {
        if(acc[expense.category]){
            acc[expense.category] += parseFloat(expense.amount)
        } else {
            acc[expense.category] = parseFloat(expense.amount)
        }
        return acc
    }, {})

    // Sort categories by total amount, descending
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    // Top 5 categories, rest as 'Others'
    const top5 = sortedCategories.slice(0, 7);
    const others = sortedCategories.slice(7);
    let othersTotal = 0;
    if (others.length > 0) {
        othersTotal = others.reduce((sum, [, amount]) => sum + amount, 0);
    }
    const chartLabels = top5.map(([cat]) => cat);
    const chartDataValues = top5.map(([, amount]) => amount);
    if (othersTotal > 0) {
        chartLabels.push('Others');
        chartDataValues.push(othersTotal);
    }

    // Simple color palette
    const chartColors = [
        '#01C38D', '#36A2EB', '#FF6384', '#FFCE56', '#9B59B6', '#B0BEC5'
    ];

    const chartData = {
        labels: chartLabels,
        datasets: [
          {
            data: chartDataValues,
            backgroundColor: chartColors,
            borderWidth: 0,
          },
        ],
      };

    const chartOptions = {
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: '#fff',
                    font: { size: 14 },
                    padding: 12,
                }
            },
            tooltip: {
                backgroundColor: '#fff',
                titleColor: '#23263a',
                bodyColor: '#23263a',
            }
        },
        cutout: '65%',
        layout: {
            padding: 0
        }
    };

    return (
        <div className="bg-transparent rounded-xl " style={{ width: 340, height: 340, margin: "0 auto" }}>
            <Doughnut data={chartData} options={chartOptions} />
        </div>
    )
}

export default ExpenseChart
