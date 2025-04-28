import { useState, useEffect } from 'react';
import Spinner from './Spinner';

function ListExpenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const handleDelete = index => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return

        fetch(`http://localhost:3000/delete-expense`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ index })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                setExpenses(prev => prev.filter((_, i) => i !== index))
            })
            .catch(error => {
                console.error(error)
                alert("Could not delete - please try again.")
            })
    }

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

    let sum = 0
    expenses.forEach(expense => {
        sum += parseFloat(expense.amount)
    })
    if(!expenses.length){
        return <p>No expenses found.</p>
    }
    if (loading) {
        return <Spinner message="Loading expenses..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }

    return (
        <>
            <h2>Expenses</h2>
            <h3>Total Expenses: ${sum.toFixed(2)}</h3>
            <ul>
                {expenses.map((expense, index) => (
                    <li key={index}>
                        {expense.category} - ${expense.amount} ({expense.description}) on {expense.date} <button onClick={() => handleDelete(index)}>🗑️</button>
                    </li>
                ))}
            </ul>
        </>
    )
};

export default ListExpenses;