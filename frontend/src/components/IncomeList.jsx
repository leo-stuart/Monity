import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import Spinner from './Spinner';
import { get, del } from '../utils/api';
import formatDate from '../utils/formatDate';

function ListIncomes() {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');

    const handleDelete = async (transactionId) => {
        if (!window.confirm("Are you sure you want to delete this income?")) return;

        try {
            await del(`/transactions/${transactionId}`);
            setIncomes(prev => prev.filter(income => income.id !== transactionId));
        } catch(err) {
            console.error(err);
            alert("Could not delete - please try again.");
        }
    }

    useEffect(() => {
        const fetchIncomes = async () => {
            try {
                const { data } = await get('/transactions');
                const incomeData = Array.isArray(data)
                    ? data.filter(transaction => transaction.typeId === 2)
                    : [];
                setIncomes(incomeData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchIncomes();
    }, []);

    const filtered = incomes
        .filter(income => (
            (category === '' ? true : income.category.toLowerCase().includes(category.toLowerCase()))
        ))
        .filter(income => (
            (date === '' ? true : income.date.startsWith(date))
        ))

    let sum = 0
    filtered.forEach(income => {
        sum += parseFloat(income.amount)
    })

    const reversedIncomes = [...filtered].reverse();

    if (loading) {
        return <Spinner message="Loading incomes..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }
    if (!filtered.length) {
        return (
            <div className="bg-[#23263a] p-4 rounded-xl shadow-lg ring-2 ring-green-400/50">
                <div className='flex flex-col md:flex-row items-center justify-between gap-4 mb-4'>
                    <h3 className="text-lg font-bold text-white">Total Incomes: <span className="text-[#01C38D]">${sum.toFixed(2)}</span></h3>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#01C38D] focus:border-[#01C38D] block w-full p-2.5 placeholder-gray-400" placeholder="Filter by category" />
                        <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#01C38D] focus:border-[#01C38D] block w-full p-2.5 placeholder-gray-400" placeholder="Filter by date (DD/MM/YY)" />
                    </div>
                    <Link
                        to="/add-income"
                        className="w-full md:w-auto text-center text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/50 font-medium rounded-lg text-sm px-5 py-2.5 transition-all">
                        Add Income
                    </Link>
                </div>
                <p className="text-white text-center py-4">No incomes found.</p>
            </div>
        )
    }

    return (
        <div className="bg-[#23263a] p-4 rounded-xl shadow-lg ring-2 ring-green-400/50">
            {/* Header */}
            <div className='flex flex-col md:flex-row items-center justify-between gap-4 mb-4'>
                <h3 className="text-lg font-bold text-white">Total Incomes: <span className="text-[#01C38D]">${sum.toFixed(2)}</span></h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#01C38D] focus:border-[#01C38D] block w-full p-2.5 placeholder-gray-400" placeholder="Filter by category" />
                    <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#01C38D] focus:border-[#01C38D] block w-full p-2.5 placeholder-gray-400" placeholder="Filter by date (DD/MM/YY)" />
                </div>
                <Link
                    to="/add-income"
                    className="w-full md:w-auto text-center text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/50 font-medium rounded-lg text-sm px-5 py-2.5 transition-all">
                    Add Income
                </Link>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <table className="w-full text-left bg-[#23263a] text-white rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-[#191E29] text-[#01C38D]">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reversedIncomes.map((income) => (
                            <tr key={income.id} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                                <td className="py-3 px-4">{formatDate(income.date)}</td>
                                <td className="py-3 px-4">{income.category}</td>
                                <td className="py-3 px-4">{income.description}</td>
                                <td className="text-green-400 py-3 px-4 text-right">${income.amount.toFixed(2)}</td>
                                <td className="py-3 px-4 text-center">
                                    <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(income.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash3-fill" viewBox="0 0 16 16">
                                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.024l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3.5-.012l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3.5-.012l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {reversedIncomes.map((income) => (
                    <div key={income.id} className="bg-[#191E29] p-4 rounded-lg border border-[#31344d]">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-white text-lg">{income.description}</p>
                                <p className="text-sm text-gray-400">{income.category}</p>
                            </div>
                            <p className="text-green-400 font-bold text-lg">${income.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">{formatDate(income.date)}</p>
                            <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(income.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

export default ListIncomes;