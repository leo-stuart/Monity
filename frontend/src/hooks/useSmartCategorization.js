import { useState } from 'react';
import { post } from '../utils/api';

/**
 * Custom hook for Smart Categorization functionality
 * Provides AI-powered category suggestions and feedback collection
 */
export const useSmartCategorization = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Get category suggestions for a transaction description
     */
    const getSuggestions = async (description, amount = 0, transactionType = 1) => {
        if (!description || description.trim().length < 3) {
            setSuggestions([]);
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await post('/ai/suggest-category', {
                description: description.trim(),
                amount: amount,
                transactionType: transactionType
            });

            const suggestionsData = response.data?.suggestions || [];
            setSuggestions(suggestionsData);
            
            return suggestionsData;

        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            setError('Failed to get category suggestions');
            
            // Return fallback suggestion
            const fallback = [{
                category: 'Uncategorized',
                confidence: 0.3,
                source: 'fallback'
            }];
            setSuggestions(fallback);
            return fallback;

        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Record user feedback on categorization suggestions
     */
    const recordFeedback = async (transactionDescription, suggestedCategory, actualCategory, wasAccepted, confidence, amount = null) => {
        try {
            await post('/ai/feedback', {
                transactionDescription,
                suggestedCategory,
                actualCategory,
                wasAccepted,
                confidence,
                amount
            });

            console.log('[SmartCategorization] Feedback recorded:', {
                wasAccepted,
                suggested: suggestedCategory,
                actual: actualCategory
            });

        } catch (error) {
            console.error('Error recording feedback:', error);
            // Don't throw error to avoid disrupting user flow
        }
    };

    /**
     * Clear current suggestions
     */
    const clearSuggestions = () => {
        setSuggestions([]);
        setError(null);
    };

    /**
     * Get the top suggestion with highest confidence
     */
    const getTopSuggestion = () => {
        if (suggestions.length === 0) return null;
        return suggestions[0];
    };

    /**
     * Check if there are high-confidence suggestions available
     */
    const hasHighConfidenceSuggestion = (threshold = 0.7) => {
        return suggestions.length > 0 && suggestions[0].confidence >= threshold;
    };

    return {
        suggestions,
        isLoading,
        error,
        getSuggestions,
        recordFeedback,
        clearSuggestions,
        getTopSuggestion,
        hasHighConfidenceSuggestion
    };
}; 