import { useState, useEffect } from 'react';
import Spinner from './Spinner';

function Savings() {
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3000/list-expenses')
            .then(response => {
                if (!response.ok) {
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
    useEffect(() => {
        fetch('http://localhost:3000/list-incomes')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })

            .then(data => {
                setIncomes(data.data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            })
    }, []);

    const savings = expenses.filter(expense => expense.category === "Make Investments")
    const withdraw = incomes.filter(incomes => incomes.category === "Withdraw Investments")

    let total = 0
    savings.forEach(expense => {
        total += parseFloat(expense.amount)
    })

    let totalWithdraw = 0
    withdraw.forEach(expense => {
        totalWithdraw += parseFloat(expense.amount)
    })

    let totalSavings = total - totalWithdraw

    if(loading){
        return <Spinner message="Loading savings..." />
    }
    if(error){
        return <p>Error: {error}</p>
    }

    return (
        <>
        <h2 className="text-4xl font-bold mb-4">${totalSavings.toFixed(2)}</h2>
        </>
    )
}

export default Savings