import { useState, useEffect } from 'react';

function ListExpenses(){
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
        return <p>Loading expenses...</p>
    }
    if(error){
        return <p>Error: {error}</p>
    }

    return (
        <ul>
            {expenses.map((expense, index) => (
                <li key={index}>
                    {expense.description} - ${expense.amount} ({expense.category}) on {expense.date}
                </li>
            ))}
        </ul>
    )
};

export default ListExpenses;