import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import Spinner from './Spinner';

function ListIncomes() {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const handleDelete = index => {
        if (!window.confirm("Are you sure you want to delete this income?")) return

        fetch(`http://localhost:3000/delete-income`, {
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
                setIncomes(prev => prev.filter((_, i) => i !== index))
            })
            .catch(error => {
                console.error(error)
                alert("Could not delete - please try again.")
            })
    }

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

    let sum = 0
    incomes.forEach(income => {
        sum += parseFloat(income.amount)
    })

    if (loading) {
        return <Spinner message="Loading incomes..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }
    if (!incomes.length) {
        return <p>No incomes found.</p>
    }
    return (
        <div className="bg-[#191E29] border-1 p-4 rounded shadow-lg shadow-green-400 ring-2 ring-green-400/50">
            <div className='flex items-center justify-between'>
                <h3>Total Incomes: ${sum.toFixed(2)}</h3>
                <div>
                    <Link
                        to="/add-expense"
                        className="inline-block text-white hover:text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br shadow-lg shadow-green-500/50 dark:shadow-green-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 focus:outline-none focus:ring-0 focus:shadow-none">
                        Add Income
                    </Link>
                </div>
            </div>
            <ul >
                {incomes.map((income, index) => (
                    <li key={index} className="odd:bg-[#191E25] p-4 rounded shadow flex justify-between items-center">
                        <span>{income.category} - ${income.amount} on {income.date} </span>
                        <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(index)}>🗑️</button>
                    </li>
                ))}
            </ul>
        </div>
    )
};

export default ListIncomes;