import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Smart button that allows users to quickly accept AI category suggestions
 */
const SmartCategoryButton = ({ suggestion, onAccept, isVisible }) => {
    const { t } = useTranslation();

    if (!isVisible || !suggestion) return null;

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'bg-green-500';
        if (confidence >= 0.6) return 'bg-yellow-500';
        return 'bg-orange-500';
    };

    const getConfidenceText = (confidence) => {
        if (confidence >= 0.8) return t('smartCategorization.high_confidence');
        if (confidence >= 0.6) return t('smartCategorization.medium_confidence');
        return t('smartCategorization.low_confidence');
    };

    return (
        <div className="mt-2 p-3 bg-[#1a1f2e] border border-[#01C38D] rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getConfidenceColor(suggestion.confidence)}`}></div>
                        <span className="text-white font-medium">{suggestion.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            {Math.round(suggestion.confidence * 100)}% • {getConfidenceText(suggestion.confidence)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onAccept(suggestion)}
                    className="px-4 py-2 bg-[#01C38D] text-white text-sm font-medium rounded-lg hover:bg-[#01C38D]/90 transition-colors"
                >
                    ✓ {t('smartCategorization.accept_suggestion')}
                </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
                💡 {t('smartCategorization.auto_create_hint')}
            </div>
        </div>
    );
};

export default SmartCategoryButton; 