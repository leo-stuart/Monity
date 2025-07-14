import Spinner from "./Spinner"
import { useState, useEffect } from 'react';
import apiClient from '../utils/api';

function FilterExpenses() {
    const [expenses, setExpenses] = useState([]);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        apiClient.get('/transactions')
            .then(response => {
                if (response.status !== 200) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.data;
            })

            .then(data => {
                // Filter expense transactions (typeId === "1")
                const expenseData = Array.isArray(data) 
                    ? data.filter(transaction => transaction.typeId === "1")
                    : [];
                setExpenses(expenseData);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            })
    }, []);

    const filtered = expenses
        .filter(expense => (
            (category === '' ? true : expense.category.includes(category))
        ))
        .filter(expense => (
            (date === '' ? true : expense.date.startsWith(date))
        ))

    if (loading) {
        return <Spinner message="Loading the most expensive purchases ..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }

    return (
        <>
            <div>
                <label>Category<input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Food" /></label>
                <label>Date<input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="MM/DD/YY" /></label>
            </div>
            {filtered.length === 0
                ? <p>No expenses match your filters.</p>
                : (
                    <ul>
                        {filtered.map((expense, index) => (
                            <li key={index}>
                                {expense.category} — ${expense.amount} ({expense.description}) on {expense.date}
                            </li>
                        ))}
                    </ul>
                )
            }
        </>
    )


}