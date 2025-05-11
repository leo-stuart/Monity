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
        <div className="bg-[#23263a] border-1 p-4 rounded-xl shadow-lg shadow-green-400 ring-2 ring-green-400/50">
            <div className='flex items-center justify-between mb-4'>
                <h3 className="text-lg font-bold text-[#01C38D]">Total Incomes: <span className="text-white">${sum.toFixed(2)}</span></h3>
                <div>
                    <Link
                        to="/add-expense"
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
                    {incomes.map((income, index) => (
                        <tr key={index} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                            <td className="py-2 px-4">{income.date}</td>
                            <td className="py-2 px-4">{income.category}</td>
                            <td className="text-green-400 py-2 px-4">${income.amount}</td>
                            <td className="py-2 px-4">
                                <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(index)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
};

export default ListIncomes;