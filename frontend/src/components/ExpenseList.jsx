import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Spinner from './Spinner'

function ListExpenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');

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

    const filtered = expenses
        .filter(expense => (
            (category === '' ? true : expense.category.toLowerCase().includes(category.toLowerCase()))
        ))
        .filter(expense => (
            (date === '' ? true : expense.date.startsWith(date))
        ))

    let sum = 0
    filtered.forEach(expense => {
        sum += parseFloat(expense.amount)
    })
    if (!expenses.length) {
        return <p>No expenses found.</p>
    }
    if (loading) {
        return <Spinner message="Loading expenses..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }

    return (
        <div className="bg-[#23263a] border-1 p-4 rounded-xl shadow-lg shadow-red-400 ring-2 ring-red-400/50">
            <div className='flex flex-col md:flex-row items-center justify-between gap-6 mb-4'>
                <h3 className="text-lg font-bold text-[#FF6384]">Total Expenses: <span className="text-white">${sum.toFixed(2)}</span></h3>
                <div className="flex gap-2">
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#FF6384] focus:border-[#FF6384] block w-full p-2.5 placeholder-gray-400" placeholder="e.g. Food" />
                    <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#FF6384] focus:border-[#FF6384] block w-full p-2.5 placeholder-gray-400" placeholder="DD/MM/YY" />
                </div>
                <Link
                    to="/add-expense"
                    className="inline-block text-white hover:text-[#23263a] bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-red-300 shadow-lg shadow-red-500/50 dark:shadow-red-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 focus:outline-none focus:ring-0 focus:shadow-none transition-colors">
                    Add Expense
                </Link>
            </div>
            <table className="w-full text-left bg-[#23263a] text-white rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-[#191E29] text-[#FF6384]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((expense, index) => (
                        <tr key={index} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                            <td className="py-2 px-4">{expense.date}</td>
                            <td className="py-2 px-4">{expense.category}</td>
                            <td className="py-2 px-4">{expense.description}</td>
                            <td className="text-red-400 py-2 px-4">${expense.amount}</td>
                            <td className="py-2 px-4">
                                <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(index)}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
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

export default ListExpenses;