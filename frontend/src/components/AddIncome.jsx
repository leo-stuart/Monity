import { useState, useEffect } from 'react';
import { get, post } from '../utils/api';
import { useTranslation } from 'react-i18next';

function AddIncome({ onAdd }) {
    const { t } = useTranslation();
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
                setError(t('addIncome.failed_load_categories'));
            }
        };
        fetchCategories();
    }, [t]);

    const incomeCategories = categories
    .filter(category => category.typeId === 2 || category.typeId === 3)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await post('/add-income', { category, amount, date });
            
            setSuccess(t('addIncome.success'));
            setCategory('');
            setAmount('');
            setDate('');
            if (onAdd) onAdd();
        } catch (err) {
            setError(err.response?.data?.message || t('addIncome.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-[#01C38D]">{t('addIncome.title')}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <select
                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required>
                        <option value="">{t('addIncome.select_category')}</option>
                        {incomeCategories.map((cat, index) => (
                            <option key={index} value={cat.name}>{cat.name}</option>
                        ))}
                </select>
                <input
                    type="number"
                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
                    placeholder={t('addIncome.amount')}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                />
                <input
                    type="date"
                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:outline-none placeholder-gray-400"
                    placeholder={t('addIncome.date')}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-60 mt-2"
                    disabled={loading}
                >
                    {loading ? t('addIncome.adding') : t('addIncome.add_income')}
                </button>
                {error && <div className="text-red-400 text-center text-sm mt-2">{error}</div>}
                {success && <div className="text-green-400 text-center text-sm mt-2">{success}</div>}
            </form>
        </div>
    );
}

export default AddIncome;