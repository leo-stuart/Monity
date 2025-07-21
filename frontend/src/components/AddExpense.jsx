import { useState, useEffect, useCallback } from 'react';
import { get, post } from '../utils/api';
import { useTranslation } from 'react-i18next';
import { useSmartCategorization } from '../hooks/useSmartCategorization';

function AddExpense({ onAdd }) {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
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
        setSuccess(null);
        
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
            
            setSuccess(t('addExpense.success'));
            setDescription('');
            setAmount('');
            setCategory('');
            setDate('');
            setShowAISuggestions(false);
            setSelectedAISuggestion(null);
            clearSuggestions();
            
            if (onAdd) onAdd();
        } catch (err) {
            setError(err.response?.data?.message || t('addExpense.failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-[#FF6384]">{t('addExpense.title')}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                    <input
                        className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                        placeholder={t('addExpense.description')}
                        value={description}
                        onChange={e => handleDescriptionChange(e.target.value)}
                        required
                    />
                    {aiLoading && (
                        <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#01C38D]"></div>
                        </div>
                    )}
                </div>
                
                {/* AI Suggestions */}
                {showAISuggestions && suggestions.length > 0 && (
                    <div className="bg-[#191E29] border border-[#31344d] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-[#01C38D] rounded-full"></div>
                            <span className="text-[#01C38D] text-sm font-medium">{t('smartCategorization.ai_suggestions')}</span>
                        </div>
                        <div className="space-y-2">
                            {suggestions.slice(0, 3).map((suggestion, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectAISuggestion(suggestion)}
                                    className="w-full text-left p-2 bg-[#23263a] hover:bg-[#2a2d4a] rounded border border-[#31344d] transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-white">{suggestion.category}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">
                                                {Math.round(suggestion.confidence * 100)}%
                                            </span>
                                            <div className="w-12 h-1 bg-gray-600 rounded overflow-hidden">
                                                <div 
                                                    className="h-full bg-[#01C38D] transition-all"
                                                    style={{ width: `${suggestion.confidence * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    {suggestion.source && (
                                        <span className="text-xs text-gray-500 capitalize">
                                            {t(`smartCategorization.${suggestion.source}`, suggestion.source.replace('_', ' '))}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <input
                    type="number"
                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                    placeholder={t('addExpense.amount')}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                />
                <div className="relative">
                    <select 
                        className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                        value={category}
                        onChange={e => handleCategoryChange(e.target.value)}
                        required>
                        <option value="">{t('addExpense.select_category')}</option>
                    {expenseCategories.map((cat, index) => (
                        <option key={index} value={cat.name}>{cat.name}</option>
                    ))}
                    </select>
                    {selectedAISuggestion && (
                        <div className="absolute -top-6 left-0">
                            <span className="text-xs text-[#01C38D] bg-[#191E29] px-2 py-1 rounded border border-[#31344d]">
                                {t('smartCategorization.ai_selected')}: {selectedAISuggestion.category} ({Math.round(selectedAISuggestion.confidence * 100)}%)
                            </span>
                        </div>
                    )}
                </div>
                <input
                    type="date"
                    className="w-full bg-[#191E29] border border-[#31344d] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#FF6384] focus:outline-none placeholder-gray-400"
                    placeholder={t('addExpense.date')}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-lg shadow-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-60 mt-2"
                    disabled={loading}
                >
                    {loading ? t('addExpense.adding') : t('addExpense.add_expense')}
                </button>
                {error && <div className="text-red-400 text-center text-sm mt-2">{error}</div>}
                {success && <div className="text-green-400 text-center text-sm mt-2">{success}</div>}
            </form>
        </div>
    );
}

export default AddExpense;