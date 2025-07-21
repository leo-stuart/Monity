import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get, del } from '../utils/api';
import formatDate from '../utils/formatDate';

/**
 * Enhanced transaction list with advanced filtering, search, and bulk operations
 */
const ImprovedTransactionList = ({ transactionType = 'all' }) => {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter and search states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // UI states
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'

    // Fetch transactions
    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const { data } = await get('/transactions');
            let transactionData = Array.isArray(data) ? data : [];
            
            // Filter by transaction type if specified
            if (transactionType === 'expenses') {
                transactionData = transactionData.filter(t => t.typeId === 1);
            } else if (transactionType === 'income') {
                transactionData = transactionData.filter(t => t.typeId === 2);
            }
            
            setTransactions(transactionData);
            setFilteredTransactions(transactionData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Advanced filtering and search
    useEffect(() => {
        let filtered = [...transactions];

        // Text search
        if (searchQuery) {
            filtered = filtered.filter(transaction =>
                transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                transaction.category?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (categoryFilter) {
            filtered = filtered.filter(transaction =>
                transaction.category?.toLowerCase().includes(categoryFilter.toLowerCase())
            );
        }

        // Date range filter
        if (dateRange.start) {
            filtered = filtered.filter(transaction =>
                new Date(transaction.date) >= new Date(dateRange.start)
            );
        }
        if (dateRange.end) {
            filtered = filtered.filter(transaction =>
                new Date(transaction.date) <= new Date(dateRange.end)
            );
        }

        // Amount range filter
        if (amountRange.min) {
            filtered = filtered.filter(transaction =>
                parseFloat(transaction.amount) >= parseFloat(amountRange.min)
            );
        }
        if (amountRange.max) {
            filtered = filtered.filter(transaction =>
                parseFloat(transaction.amount) <= parseFloat(amountRange.max)
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'amount':
                    aValue = parseFloat(a.amount);
                    bValue = parseFloat(b.amount);
                    break;
                case 'category':
                    aValue = a.category?.toLowerCase() || '';
                    bValue = b.category?.toLowerCase() || '';
                    break;
                case 'description':
                    aValue = a.description?.toLowerCase() || '';
                    bValue = b.description?.toLowerCase() || '';
                    break;
                default: // date
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredTransactions(filtered);
    }, [transactions, searchQuery, categoryFilter, dateRange, amountRange, sortBy, sortOrder]);

    // Bulk operations
    const handleSelectAll = () => {
        if (selectedTransactions.size === filteredTransactions.length) {
            setSelectedTransactions(new Set());
        } else {
            setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
        }
    };

    const handleSelectTransaction = (id) => {
        const newSelected = new Set(selectedTransactions);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedTransactions(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedTransactions.size === 0) return;
        
        if (!window.confirm(t('transactions.confirm_bulk_delete', { count: selectedTransactions.size }))) return;

        try {
            await Promise.all(
                Array.from(selectedTransactions).map(id => del(`/transactions/${id}`))
            );
            
            setTransactions(prev => prev.filter(t => !selectedTransactions.has(t.id)));
            setSelectedTransactions(new Set());
        } catch (error) {
            console.error('Bulk delete failed:', error);
            alert(t('transactions.bulk_delete_failed'));
        }
    };

    // Calculate totals
    const totals = filteredTransactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.typeId === 1) { // Expense
            acc.expenses += amount;
        } else if (transaction.typeId === 2) { // Income
            acc.income += amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });

    const balance = totals.income - totals.expenses;

    // Transaction card component
    const TransactionCard = ({ transaction, isSelected, onSelect }) => (
        <div className={`bg-[#23263a] border border-[#31344d] rounded-lg p-4 hover:border-[#01C38D] transition-all duration-200 ${isSelected ? 'ring-2 ring-[#01C38D]' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(transaction.id)}
                        className="rounded border-[#31344d] text-[#01C38D] focus:ring-[#01C38D]"
                    />
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.typeId === 1 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                        {transaction.typeId === 1 ? '💸' : '💰'}
                    </div>
                    
                    <div>
                        <h4 className="text-white font-medium">{transaction.description}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.date)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className={`font-bold text-lg ${
                            transaction.typeId === 1 ? 'text-red-400' : 'text-green-400'
                        }`}>
                            {transaction.typeId === 1 ? '-' : '+'}${parseFloat(transaction.amount).toFixed(2)}
                        </div>
                    </div>
                    
                    <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors p-1"
                        title={t('transactions.delete')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );

    const handleDelete = async (transactionId) => {
        if (!window.confirm(t('transactions.confirm_delete'))) return;

        try {
            await del(`/transactions/${transactionId}`);
            setTransactions(prev => prev.filter(t => t.id !== transactionId));
        } catch (error) {
            console.error('Delete failed:', error);
            alert(t('transactions.delete_failed'));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 rounded-full border-4 border-[#31344d] border-t-[#01C38D] animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{t('transactions.error')}: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="bg-gradient-to-r from-[#23263a] to-[#31344d] rounded-xl p-6 border border-[#31344d]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{filteredTransactions.length}</div>
                        <div className="text-gray-400 text-sm">{t('transactions.total_transactions')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">${totals.income.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">{t('transactions.total_income')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">${totals.expenses.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">{t('transactions.total_expenses')}</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${balance.toFixed(2)}
                        </div>
                        <div className="text-gray-400 text-sm">{t('transactions.net_balance')}</div>
                    </div>
                </div>
            </div>

            {/* Search and filters */}
            <div className="bg-[#23263a] border border-[#31344d] rounded-xl p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('transactions.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#191E29] border border-[#31344d] rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-[#01C38D]"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Quick filters */}
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#01C38D]"
                        >
                            <option value="date">{t('transactions.sort_by_date')}</option>
                            <option value="amount">{t('transactions.sort_by_amount')}</option>
                            <option value="category">{t('transactions.sort_by_category')}</option>
                            <option value="description">{t('transactions.sort_by_description')}</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white hover:border-[#01C38D] transition-colors"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>

                        <button
                            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                            className="bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white hover:border-[#01C38D] transition-colors"
                        >
                            🔍 {t('transactions.filters')}
                        </button>
                    </div>
                </div>

                {/* Advanced filters panel */}
                {isFilterPanelOpen && (
                    <div className="mt-4 pt-4 border-t border-[#31344d]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">{t('transactions.filter_category')}</label>
                                <input
                                    type="text"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white"
                                    placeholder={t('transactions.any_category')}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">{t('transactions.date_range')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white"
                                    />
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">{t('transactions.amount_range')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder={t('transactions.min_amount')}
                                        value={amountRange.min}
                                        onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                                        className="w-full bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white"
                                    />
                                    <input
                                        type="number"
                                        placeholder={t('transactions.max_amount')}
                                        value={amountRange.max}
                                        onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                                        className="w-full bg-[#191E29] border border-[#31344d] rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk actions */}
            {selectedTransactions.size > 0 && (
                <div className="bg-[#01C38D]/10 border border-[#01C38D]/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[#01C38D] font-medium">
                            {t('transactions.selected_count', { count: selectedTransactions.size })}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedTransactions(new Set())}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                {t('transactions.clear_selection')}
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                {t('transactions.delete_selected')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction list */}
            <div className="space-y-4">
                {/* Select all checkbox */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-[#31344d] text-[#01C38D] focus:ring-[#01C38D]"
                        />
                        <span className="text-white">{t('transactions.select_all')}</span>
                    </label>
                    
                    <Link
                        to={transactionType === 'expenses' ? '/add-expense' : transactionType === 'income' ? '/add-income' : '/transactions'}
                        className="bg-[#01C38D] text-[#191E29] px-4 py-2 rounded-lg font-medium hover:bg-[#01A071] transition-colors"
                    >
                        + {t('transactions.add_new')}
                    </Link>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="bg-[#23263a] border border-[#31344d] rounded-xl p-12 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('transactions.no_transactions')}</h3>
                        <p className="text-gray-400 mb-6">{t('transactions.no_transactions_desc')}</p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                to="/add-expense"
                                className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                💸 {t('transactions.add_expense')}
                            </Link>
                            <Link
                                to="/add-income"
                                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                                💰 {t('transactions.add_income')}
                            </Link>
                        </div>
                    </div>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <TransactionCard
                            key={transaction.id}
                            transaction={transaction}
                            isSelected={selectedTransactions.has(transaction.id)}
                            onSelect={handleSelectTransaction}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ImprovedTransactionList; 