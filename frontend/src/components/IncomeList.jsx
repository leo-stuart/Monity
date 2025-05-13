import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import Spinner from './Spinner';
import { getToken } from '../utils/api';

function ListIncomes() {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const handleDelete = transactionId => {
        if (!window.confirm("Are you sure you want to delete this income?")) return

        const token = getToken();
        if (!token) {
            setError('Authentication required');
            return;
        }

        fetch(`http://localhost:3000/transactions/${transactionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                setIncomes(prev => prev.filter(income => income.id !== transactionId))
            })
            .catch(error => {
                console.error(error)
                alert("Could not delete - please try again.")
            })
    }

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        fetch('http://localhost:3000/transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })

            .then(data => {
                // Filter income transactions (typeId === "2")
                const incomeData = Array.isArray(data) 
                    ? data.filter(transaction => transaction.typeId === "2")
                    : [];
                setIncomes(incomeData);
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

    const reversedIncomes = [...incomes].reverse();

    if (loading) {
        return <Spinner message="Loading incomes..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }
    if (!incomes.length) {
        return (
            <div className="bg-[#23263a] border-1 p-4 rounded-xl shadow-lg shadow-green-400 ring-2 ring-green-400/50">
                <p>No incomes found.</p>
                <Link
                    to="/add-income"
        className="inline-block text-white hover:text-[#23263a] bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-green-300 shadow-lg shadow-green-500/50 dark:shadow-green-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 focus:outline-none focus:ring-0 focus:shadow-none transition-colors">
                    Add Income
                </Link>
            </div>
        )
    }
    
    return (
        <div className="bg-[#23263a] border-1 p-4 rounded-xl shadow-lg shadow-green-400 ring-2 ring-green-400/50">
            <div className='flex items-center justify-between mb-4'>
                <h3 className="text-lg font-bold text-[#01C38D]">Total Incomes: <span className="text-white">${sum.toFixed(2)}</span></h3>
                <div>
                    <Link
                        to="/add-income"
                        className="inline-block text-white hover:text-[#23263a] bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-green-300 shadow-lg shadow-green-500/50 dark:shadow-green-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 focus:outline-none focus:ring-0 focus:shadow-none transition-colors">
                        Add Income
                    </Link>
                </div>
            </div>
            <table className="w-full text-left bg-[#23263a] text-white rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-[#191E29] text-[#01C38D]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reversedIncomes.map((income) => (
                        <tr key={income.id} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                            <td className="py-2 px-4">{income.date}</td>
                            <td className="py-2 px-4">{income.category}</td>
                            <td className="text-green-400 py-2 px-4">${income.amount.toFixed(2)}</td>
                            <td className="py-2 px-4">
                                <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(income.id)}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
</svg></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
};

export default ListIncomes;