import { useState, useEffect } from 'react';

function ListIncomes(){
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3000/list-incomes')
        .then(response => {
            if(!response.ok){
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

    if(loading){
        return <p>Loading incomes...</p>
    }
    if(error){
        return <p>Error: {error}</p>
    }
    if(!incomes.length){
        return <p>No incomes found.</p>
    }
    return (
        <>
        <h2>Incomes</h2>
        <ul>
            {incomes.map((income, index) => (
                <li key={index}>
                    ({income.category}) - ${income.amount} on {income.date}
                </li>
            ))}
        </ul>
        </>
    )
};

export default ListIncomes;