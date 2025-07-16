import { useState, useEffect } from 'react';
import { get, post } from '../utils/api';

function AddIncome({ onAdd }) {
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await get('/categories');
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to load categories');
            }
        };
        fetchCategories();
    }, []);

    const incomeCategories = categories
    .filter(category => category.typeId === 2 || category.typeId === 3)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await post('/add-income', { category, amount, date });
            
            setSuccess('Income added!');
            setCategory(''); setAmount(''); setDate('');
            if (onAdd) onAdd();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add income');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#23263a] rounded-xl shadow-lg w-full max-w-2xl mx-auto mt-10 p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-6 text-[#01C38D]">Add Income</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <select
                    className="bg-[#191E29] border border-[#31344d] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
                    placeholder="Category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required>
                        <option value="">Select a category</option>
                        {incomeCategories.map((cat, index) => (
                            <option key={index} value={cat.name}>{cat.name}</option>
                        ))}
                </select>
                <input
                    type="number"
                    className="bg-[#191E29] border border-[#31344d] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
                    placeholder="Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                />
                <input
                    type="date"
                    className="bg-[#191E29] border border-[#31344d] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
                    placeholder="Date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold py-2 rounded-lg shadow hover:from-green-500 hover:to-green-700 transition-colors disabled:opacity-60 mt-2"
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'Add Income'}
                </button>
                {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
                {success && <div className="text-green-400 text-sm mt-2">{success}</div>}
            </form>
        </div>
    );
}

export default AddIncome;