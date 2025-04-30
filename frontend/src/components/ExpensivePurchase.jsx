import Spinner from "./Spinner"
import { useState, useEffect } from 'react';

function ExpensivePurchase(){
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
        return <Spinner message="Loading the most expensive purchases ..." />
    }
    if(error){
        return <p>Error: {error}</p>
    }
    
    const topExpenses = expenses
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0,5)
    
    if(topExpenses.length === 0){
        return <p>No expenses found.</p>;
    }

    return (
        <>
            <ul>
                {topExpenses.map((expense, index) => (
                    <li key={index}>
                        {index+1}. {expense.category} - ${expense.amount} ({expense.description}) on {expense.date}
                    </li>
                ))}
            </ul>
        </>
    )
}

export default ExpensivePurchase
