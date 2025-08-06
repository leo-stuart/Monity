import { useState, useEffect, useCallback } from 'react';
import { get, post } from '../utils/api';
import { useTranslation } from 'react-i18next';
import { useSmartCategorization } from '../hooks/useSmartCategorization';
import { useNotifications } from './NotificationSystem';
import { FaPlus, FaArrowTrendDown } from 'react-icons/fa6';
import { FaDollarSign, FaCalendarAlt, FaListUl, FaEdit, FaBrain } from 'react-icons/fa';

function AddExpense({ onAdd }) {
    const { t } = useTranslation();
    const { success, error: notifyError } = useNotifications();
    const [categories, setCategories] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Smart Categorization
    const { 
        suggestions, 
        isLoading: aiLoading, 
        getSuggestions, 
        recordFeedback, 
        clearSuggestions,
        getTopSuggestion,
        hasHighConfidenceSuggestion 
    } = useSmartCategorization();
    
    const [showAISuggestions, setShowAISuggestions] = useState(false);
    const [selectedAISuggestion, setSelectedAISuggestion] = useState(null);
    const [debounceTimer, setDebounceTimer] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await get('/categories');
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError(t('addExpense.failed_load_categories'));
            }
        };
        fetchCategories();
    }, [t]);

    const expenseCategories = categories
    .filter(category => category.typeId === 1 || category.typeId === 3)

    // Debounced AI suggestion fetching
    const handleDescriptionChange = useCallback((value) => {
        setDescription(value);
        
        // Clear previous timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // Clear suggestions if description is too short
        if (value.trim().length < 3) {
            clearSuggestions();
            setShowAISuggestions(false);
            return;
        }
        
        // Set new timer for AI suggestions
        const timer = setTimeout(async () => {
            const amountValue = parseFloat(amount) || 0;
            await getSuggestions(value, amountValue, 1);
            setShowAISuggestions(true);
        }, 800); // 800ms debounce
        
        setDebounceTimer(timer);
    }, [amount, getSuggestions, debounceTimer, clearSuggestions]);

    // Handle AI suggestion selection
    const handleSelectAISuggestion = (suggestion) => {
        setCategory(suggestion.category);
        setSelectedAISuggestion(suggestion);
        setShowAISuggestions(false);
        
        // Check if category exists in the current categories list
        const categoryExists = expenseCategories.some(cat => cat.name === suggestion.category);
        
        if (!categoryExists) {
            // Add the AI suggested category to the local state so user can see it in dropdown
            const newCategory = {
                id: `temp-${Date.now()}`, // Temporary ID
                name: suggestion.category,
                typeId: 1, // Expense type
                userId: 'current-user'
            };
            setCategories(prev => [...prev, newCategory]);
        }
    };

    // Handle manual category selection (when user chooses different category)
    const handleCategoryChange = (selectedCategory) => {
        setCategory(selectedCategory);
        
        // If user had an AI suggestion but chose different category, record feedback
        if (selectedAISuggestion && selectedAISuggestion.category !== selectedCategory) {
            recordFeedback(
                description,
                selectedAISuggestion.category,
                selectedCategory,
                false,
                selectedAISuggestion.confidence,
                parseFloat(amount) || 0
            );
        }
        
        setSelectedAISuggestion(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        success('');
        
        try {
            // Prepare data with AI feedback information
            const transactionData = {
                description, 
                amount, 
                category, 
                date,
                wasAISuggested: !!selectedAISuggestion,
                aiConfidence: selectedAISuggestion?.confidence || null,
                suggestedCategory: selectedAISuggestion?.category || null
            };

                        await post('/add-expense', transactionData);

            // Use notification system instead of local state
            if (selectedAISuggestion && selectedAISuggestion.category === category) {
                success(t('addExpense.success_with_ai_category', { category }));
            } else {
                success(t('addExpense.success'));
            }
            
            setDescription('');
            setAmount('');
            setCategory('');
            setDate('');
            setShowAISuggestions(false);
            setSelectedAISuggestion(null);
            clearSuggestions();

            if (onAdd) onAdd();
        } catch (err) {
            notifyError(err.response?.data?.message || t('addExpense.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#191E29] via-[#1a1f2e] to-[#23263a] p-4 md:p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-4 shadow-lg">
                        <FaArrowTrendDown className="text-white text-2xl" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('addExpense.title')}</h1>
                    <p className="text-gray-400 text-lg">Track your spending with smart categorization</p>
                </div>

                {/* Add Expense Form */}
                <div className="bg-gradient-to-r from-[#23263a] to-[#2a2f45] p-6 md:p-8 rounded-2xl shadow-2xl border border-[#31344d]/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <FaPlus className="text-red-400 text-lg" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Add New Expense</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Description Input */}
                        <div className="space-y-2">
                            <label className="block text-white font-medium text-sm uppercase tracking-wide">
                                Description
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full bg-[#191E29] border border-[#31344d]/50 text-white rounded-xl p-4 pl-12 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                                    placeholder={t('addExpense.description')}
                                    value={description}
                                    onChange={e => handleDescriptionChange(e.target.value)}
                                    required
                                />
                                <FaEdit className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                {aiLoading && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-[#01C38D]/30 border-t-[#01C38D] rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* AI Suggestions */}
                        {showAISuggestions && suggestions.length > 0 && (
                            <div className="bg-[#191E29]/60 border border-[#31344d]/30 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 bg-[#01C38D]/20 rounded-lg flex items-center justify-center">
                                        <FaBrain className="text-[#01C38D] text-sm" />
                                    </div>
                                    <span className="text-[#01C38D] text-sm font-medium">{t('smartCategorization.ai_suggestions')}</span>
                                </div>
                                <div className="grid gap-2">
                                    {suggestions.slice(0, 3).map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelectAISuggestion(suggestion)}
                                            className="w-full text-left p-3 bg-[#23263a]/60 hover:bg-[#2a2d4a]/80 rounded-lg border border-[#31344d]/30 transition-all duration-200 group"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-medium">{suggestion.category}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400 bg-[#191E29]/50 px-2 py-1 rounded">
                                                        {Math.round(suggestion.confidence * 100)}%
                                                    </span>
                                                    <div className="w-12 h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-[#01C38D] transition-all duration-300"
                                                            style={{ width: `${suggestion.confidence * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {suggestion.source && (
                                                <span className="text-xs text-gray-500 capitalize mt-1 block">
                                                    {t(`smartCategorization.${suggestion.source}`, suggestion.source.replace('_', ' '))}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="block text-white font-medium text-sm uppercase tracking-wide">
                                Amount
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-[#191E29] border border-[#31344d]/50 text-white rounded-xl p-4 pl-12 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                                    placeholder={t('addExpense.amount')}
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    required
                                />
                                <FaDollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {/* Category Selection */}
                        <div className="space-y-2">
                            <label className="block text-white font-medium text-sm uppercase tracking-wide">
                                Expense Category
                            </label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-[#191E29] border border-[#31344d]/50 text-white rounded-xl p-4 pl-12 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none"
                                    value={category}
                                    onChange={e => handleCategoryChange(e.target.value)}
                                    required
                                >
                                    <option value="" className="text-gray-400">{t('addExpense.select_category')}</option>
                                    {expenseCategories.map((cat, index) => (
                                        <option key={index} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <FaListUl className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                {selectedAISuggestion && (
                                    <div className="absolute -top-8 left-0">
                                        <span className="text-xs text-[#01C38D] bg-[#191E29]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#31344d]/50 flex items-center gap-2">
                                            <FaBrain className="text-[#01C38D]" />
                                            {t('smartCategorization.ai_selected')}: {selectedAISuggestion.category} ({Math.round(selectedAISuggestion.confidence * 100)}%)
                                        </span>
                                    </div>
                                )}
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
                                    className="w-full bg-[#191E29] border border-[#31344d]/50 text-white rounded-xl p-4 pl-12 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
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
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {t('addExpense.adding')}
                                </>
                            ) : (
                                <>
                                    <FaPlus className="text-lg" />
                                    {t('addExpense.add_expense')}
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

                    {/* Quick Tips with AI Features */}
                    <div className="mt-8 p-4 bg-[#191E29]/30 rounded-xl border border-[#31344d]/30">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            Smart Features & Tips
                        </h3>
                        <ul className="text-gray-400 text-sm space-y-1">
                            <li>• AI will suggest categories as you type descriptions</li>
                            <li>• Add detailed descriptions for better categorization</li>
                            <li>• Use the exact amount you spent</li>
                            <li>• Select the actual date of the expense</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddExpense;