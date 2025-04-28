import { useState, useEffect } from 'react';
import Spinner from './Spinner';

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

    let sum = 0
    incomes.forEach(income => {
        sum += parseFloat(income.amount)
    })

    if(loading){
        return <Spinner message="Loading incomes..."/>
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
        <h3>Total Incomes: ${sum.toFixed(2)}</h3>
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