import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Visual component showing group spending statistics
 */
const GroupSpendingCard = ({ group }) => {
    const { t } = useTranslation();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return t('groups.no_activity');
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return t('groups.today');
        if (diffDays === 1) return t('groups.yesterday');
        if (diffDays < 7) return t('groups.days_ago', { count: diffDays });
        if (diffDays < 30) return t('groups.weeks_ago', { count: Math.floor(diffDays / 7) });
        return date.toLocaleDateString();
    };

    const getActivityColor = (lastActivity) => {
        if (!lastActivity) return 'bg-gray-500';
        const date = new Date(lastActivity);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) return 'bg-green-500';
        if (diffDays <= 30) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getSpendingLevel = (totalSpent) => {
        if (totalSpent === 0) return { level: 'none', color: 'text-gray-400' };
        if (totalSpent < 100) return { level: 'low', color: 'text-green-400' };
        if (totalSpent < 500) return { level: 'medium', color: 'text-yellow-400' };
        if (totalSpent < 1000) return { level: 'high', color: 'text-orange-400' };
        return { level: 'very_high', color: 'text-red-400' };
    };

    const spendingLevel = getSpendingLevel(group.totalSpent);

    return (
        <div className="mt-3 p-4 bg-[#1a1f2e] rounded-lg border border-[#31344d]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${spendingLevel.color}`}>
                            {formatCurrency(group.totalSpent)}
                        </span>
                        <span className="text-sm text-gray-400">
                            {t('groups.total_spent')}
                        </span>
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${getActivityColor(group.lastActivity)}`}></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                    <div className="text-white font-semibold">{group.expenseCount || 0}</div>
                    <div className="text-gray-400 text-xs">{t('groups.expenses')}</div>
                </div>
                <div className="text-center">
                    <div className="text-white font-semibold">{group.memberCount || 0}</div>
                    <div className="text-gray-400 text-xs">{t('groups.members')}</div>
                </div>
                <div className="text-center">
                    <div className="text-white font-semibold">
                        {formatCurrency(group.avgSpentPerMember)}
                    </div>
                    <div className="text-gray-400 text-xs">{t('groups.per_member')}</div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#31344d]">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{t('groups.last_activity')}</span>
                    <span className="text-gray-300">{formatDate(group.lastActivity)}</span>
                </div>
            </div>

            {/* Spending Progress Bar */}
            {group.totalSpent > 0 && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{t('groups.spending_level')}</span>
                        <span className={spendingLevel.color}>
                            {t(`groups.${spendingLevel.level}_spending`)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                spendingLevel.level === 'low' ? 'bg-green-500' :
                                spendingLevel.level === 'medium' ? 'bg-yellow-500' :
                                spendingLevel.level === 'high' ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ 
                                width: `${Math.min(100, (group.totalSpent / 1000) * 100)}%` 
                            }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupSpendingCard; 