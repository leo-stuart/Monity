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

    const categoryTotals = expenses.reduce((acc, expense) => {
        if(acc[expense.category]){
            acc[expense.category] += parseFloat(expense.amount)
        } else {
            acc[expense.category] = parseFloat(expense.amount)
        }
        return acc
    }, {})


    const chartData = {
        labels: Object.keys(categoryTotals),
        datasets: [
          {
            data: Object.values(categoryTotals),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#8AFFC1', '#E74C3C', '#9B59B6'
            ],
            borderWidth: 1,
          },
        ],
      };


    return (
    <div style={{ width: '300px', margin: '0 auto' }}>
      <Doughnut data={chartData} key={JSON.stringify(chartData)} />
    </div>
    )

}

export default ExpenseChart
