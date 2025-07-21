import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from './NotificationSystem';
import { get, post, put, del } from '../utils/api';
import { EmptyBudgets, LoadingState } from './EmptyStates';

/**
 * Enhanced Budgets Component with modern UI and improved functionality
 */
const EnhancedBudgets = () => {
    const { t } = useTranslation();
    const { success, error: notifyError } = useNotifications();
    
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [newBudget, setNewBudget] = useState({
        name: '',
        amount: '',
        categoryId: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0]
    });

    const periods = [
        { value: 'weekly', label: t('budgets.weekly') },
        { value: 'monthly', label: t('budgets.monthly') },
        { value: 'quarterly', label: t('budgets.quarterly') },
        { value: 'yearly', label: t('budgets.yearly') }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [budgetsRes, categoriesRes] = await Promise.all([
                get('/budgets'),
                get('/categories')
            ]);
            setBudgets(budgetsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            notifyError(t('budgets.fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        
        try {
            const { data } = await post('/budgets', newBudget);
            setBudgets(prev => [...prev, data]);
            setNewBudget({ name: '', amount: '', categoryId: '', period: 'monthly', startDate: new Date().toISOString().split('T')[0] });
            setShowAddForm(false);
            success(t('budgets.add_success'));
        } catch (error) {
            notifyError(error.response?.data?.message || t('budgets.add_error'));
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        
        try {
            const { data } = await put(`/budgets/${editingBudget.id}`, editingBudget);
            setBudgets(prev => prev.map(b => b.id === editingBudget.id ? data : b));
            setEditingBudget(null);
            success(t('budgets.update_success'));
        } catch (error) {
            notifyError(error.response?.data?.message || t('budgets.update_error'));
        }
    };

    const handleDeleteBudget = async (id) => {
        if (!window.confirm(t('budgets.delete_confirm'))) return;
        
        try {
            await del(`/budgets/${id}`);
            setBudgets(prev => prev.filter(b => b.id !== id));
            success(t('budgets.delete_success'));
        } catch (error) {
            notifyError(error.response?.data?.message || t('budgets.delete_error'));
        }
    };

    const getProgressPercentage = (spent, budget) => {
        return Math.min((spent / budget) * 100, 100);
    };

    const getProgressColor = (percentage) => {
        if (percentage < 70) return 'bg-[#01C38D]';
        if (percentage < 90) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : t('budgets.unknown_category');
    };

    if (loading) {
        return <LoadingState message={t('budgets.loading')} />;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('budgets.title')}</h1>
                    <p className="text-gray-400">{t('budgets.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 sm:mt-0 bg-[#01C38D] text-white px-6 py-3 rounded-lg hover:bg-[#00b37e] transition-colors flex items-center gap-2 font-medium"
                >
                    <span className="text-lg">+</span>
                    {t('budgets.add_new')}
                </button>
            </div>

            {/* Budgets Summary Cards */}
            {budgets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[#01C38D]/20 rounded-lg flex items-center justify-center">
                                <span className="text-[#01C38D] text-xl">💰</span>
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{t('budgets.total_budget')}</h3>
                                <p className="text-gray-400 text-sm">{t('budgets.all_periods')}</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            ${budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-yellow-500 text-xl">⚠️</span>
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{t('budgets.at_risk')}</h3>
                                <p className="text-gray-400 text-sm">{t('budgets.over_80_percent')}</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-yellow-500">
                            {budgets.filter(b => getProgressPercentage(b.spent || 0, b.amount) >= 80).length}
                        </p>
                    </div>

                    <div className="bg-[#24293A] rounded-lg border border-[#31344d] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-red-500 text-xl">🚨</span>
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{t('budgets.exceeded')}</h3>
                                <p className="text-gray-400 text-sm">{t('budgets.over_budget')}</p>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-red-500">
                            {budgets.filter(b => getProgressPercentage(b.spent || 0, b.amount) >= 100).length}
                        </p>
                    </div>
                </div>
            )}

            {/* Budgets List */}
            {budgets.length === 0 ? (
                <EmptyBudgets />
            ) : (
                <div className="space-y-4">
                    {budgets.map((budget) => {
                        const spent = budget.spent || 0;
                        const percentage = getProgressPercentage(spent, budget.amount);
                        const remaining = Math.max(budget.amount - spent, 0);
                        
                        return (
                            <div
                                key={budget.id}
                                className="bg-[#24293A] rounded-lg border border-[#31344d] p-6 hover:border-[#01C38D]/30 transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                                    <div className="flex items-center gap-4 mb-4 lg:mb-0">
                                        <div className="w-12 h-12 bg-[#01C38D]/20 rounded-lg flex items-center justify-center">
                                            <span className="text-[#01C38D] text-xl">📊</span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">{budget.name}</h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <span>{getCategoryName(budget.categoryId)}</span>
                                                <span>•</span>
                                                <span className="capitalize">{budget.period}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setEditingBudget(budget)}
                                            className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                                            title={t('budgets.edit')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBudget(budget.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors p-2"
                                            title={t('budgets.delete')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">
                                            ${spent.toFixed(2)} {t('budgets.of')} ${budget.amount}
                                        </span>
                                        <span className={`font-medium ${
                                            percentage >= 100 ? 'text-red-400' :
                                            percentage >= 80 ? 'text-yellow-400' : 'text-[#01C38D]'
                                        }`}>
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    
                                    <div className="w-full bg-[#191E29] rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className={`${remaining > 0 ? 'text-[#01C38D]' : 'text-red-400'}`}>
                                            ${remaining.toFixed(2)} {remaining > 0 ? t('budgets.remaining') : t('budgets.over_budget')}
                                        </span>
                                        <span className="text-gray-400">
                                            {budget.period === 'monthly' ? '30 days' : budget.period}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Budget Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#24293A] rounded-lg border border-[#31344d] w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{t('budgets.add_new')}</h2>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddBudget} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {t('budgets.name')}
                                </label>
                                <input
                                    type="text"
                                    value={newBudget.name}
                                    onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:border-transparent transition-all"
                                    placeholder={t('budgets.name_placeholder')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {t('budgets.amount')}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newBudget.amount}
                                    onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:border-transparent transition-all"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {t('budgets.category')}
                                </label>
                                <select
                                    value={newBudget.categoryId}
                                    onChange={(e) => setNewBudget(prev => ({ ...prev, categoryId: e.target.value }))}
                                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:border-transparent transition-all"
                                    required
                                >
                                    <option value="">{t('budgets.select_category')}</option>
                                    {categories.filter(c => c.typeId === 1).map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {t('budgets.period')}
                                </label>
                                <select
                                    value={newBudget.period}
                                    onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value }))}
                                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:border-transparent transition-all"
                                >
                                    {periods.map((period) => (
                                        <option key={period.value} value={period.value}>
                                            {period.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    {t('budgets.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#01C38D] text-white py-3 rounded-lg hover:bg-[#00b37e] transition-colors"
                                >
                                    {t('budgets.add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Budget Modal */}
            {editingBudget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#24293A] rounded-lg border border-[#31344d] w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{t('budgets.edit')}</h2>
                            <button
                                onClick={() => setEditingBudget(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateBudget} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {t('budgets.name')}
                                </label>
                                <input
                                    type="text"
                                    value={editingBudget.name}
                                    onChange={(e) => setEditingBudget(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {t('budgets.amount')}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editingBudget.amount}
                                    onChange={(e) => setEditingBudget(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#01C38D] focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingBudget(null)}
                                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    {t('budgets.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#01C38D] text-white py-3 rounded-lg hover:bg-[#00b37e] transition-colors"
                                >
                                    {t('budgets.update')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedBudgets; 