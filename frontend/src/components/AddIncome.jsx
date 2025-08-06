import { useState, useEffect } from 'react';
import { get, post } from '../utils/api';
import { useTranslation } from 'react-i18next';
import { useNotifications } from './NotificationSystem';
import { FaPlus, FaArrowTrendUp } from 'react-icons/fa6';
import { FaDollarSign, FaCalendarAlt, FaListUl } from 'react-icons/fa';

function AddIncome({ onAdd }) {
    const { t } = useTranslation();
    const { success, error: notifyError } = useNotifications();
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        success('');
        try {
            await post('/add-income', { category, amount, date });
            
            success(t('addIncome.success'));
            setCategory('');
            setAmount('');
            setDate('');
            if (onAdd) onAdd();
        } catch (err) {
            notifyError(err.response?.data?.message || t('addIncome.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#191E29] via-[#1a1f2e] to-[#23263a] p-4 md:p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
                        <FaArrowTrendUp className="text-white text-2xl" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('addIncome.title')}</h1>
                    <p className="text-gray-400 text-lg">Track your earnings and income sources</p>
                </div>

                {/* Add Income Form */}
                <div className="bg-gradient-to-r from-[#23263a] to-[#2a2f45] p-6 md:p-8 rounded-2xl shadow-2xl border border-[#31344d]/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <FaPlus className="text-green-400 text-lg" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Add New Income</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Selection */}
                        <div className="space-y-2">
                            <label className="block text-white font-medium text-sm uppercase tracking-wide">
                                Income Category
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full bg-[#191E29] border border-[#31344d]/50 text-white rounded-xl p-4 pl-12 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                >
                                    <option value="" className="text-gray-400">{t('addIncome.select_category')}</option>
                                    {incomeCategories.map((cat, index) => (
                                        <option key={index} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <FaListUl className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="block text-white font-medium text-sm uppercase tracking-wide">
                                Amount
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-[#191E29] border border-[#31344d]/50 text-white rounded-xl p-4 pl-12 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                                    placeholder={t('addIncome.amount')}
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    required
                                />
                                <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className="space-y-2">
                            <label className="block text-white font-medium text-sm uppercase tracking-wide">
                                Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full bg-[#191E29] border border-[#31344d]/50 text-white rounded-xl p-4 pl-12 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                />
                                <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {t('addIncome.adding')}
                                </>
                            ) : (
                                <>
                                    <FaPlus className="text-lg" />
                                    {t('addIncome.add_income')}
                                </>
                            )}
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                {error}
                            </div>
                        )}
                    </form>

                    {/* Quick Tips */}
                    <div className="mt-8 p-4 bg-[#191E29]/30 rounded-xl border border-[#31344d]/30">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            Quick Tips
                        </h3>
                        <ul className="text-gray-400 text-sm space-y-1">
                            <li>• Make sure to select the correct income category</li>
                            <li>• Enter the exact amount you received</li>
                            <li>• Use the actual date when you received the income</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddIncome;