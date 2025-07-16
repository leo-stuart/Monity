import { useState, useEffect } from 'react';
import { get, post } from '../utils/api';

function AddExpense({ onAdd }) {
    const [categories, setCategories] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
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

    const expenseCategories = categories
    .filter(category => category.typeId === 1 || category.typeId === 3)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await post('/add-expense', { description, amount, category, date });
            
            setSuccess('Expense added!');
            setDescription(''); setAmount(''); setCategory(''); setDate('');
            if (onAdd) onAdd();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#23263a] rounded-xl shadow-lg p-8 max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6 text-[#FF6384]">Add Expense</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    className="bg-[#191E29] border border-[#31344d] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                />
                <input
                    type="number"
                    className="bg-[#191E29] border border-[#31344d] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                    placeholder="Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                />
                <select 
                    className="bg-[#191E29] border border-[#31344d] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                    placeholder="Category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required>
                        <option value="">Select a category</option>
                    {expenseCategories.map((cat, index) => (
                        <option key={index} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
                <input
                    type="date"
                    className="bg-[#191E29] border border-[#31344d] text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                    placeholder="Date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold py-2 rounded-lg shadow hover:from-red-500 hover:to-red-700 transition-colors disabled:opacity-60 mt-2"
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'Add Expense'}
                </button>
                {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
                {success && <div className="text-green-400 text-sm mt-2">{success}</div>}
            </form>
        </div>
    );
}

export default AddExpense;