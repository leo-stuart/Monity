import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Reusable empty state components for better UX when there's no data
 */

const EmptyStateBase = ({ 
    icon, 
    title, 
    description, 
    actions = [], 
    illustration,
    className = '' 
}) => {
    return (
        <div className={`text-center py-12 px-6 ${className}`}>
            {/* Illustration or Icon */}
            <div className="mb-6">
                {illustration ? (
                    <div className="w-32 h-32 mx-auto mb-4">
                        {illustration}
                    </div>
                ) : (
                    <div className="text-6xl mb-4">
                        {icon}
                    </div>
                )}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {description}
            </p>

            {/* Actions */}
            {actions.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {actions.map((action, index) => {
                        const baseClasses = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center";
                        const primaryClasses = "bg-[#01C38D] text-[#191E29] hover:bg-[#01A071] hover:scale-105";
                        const secondaryClasses = "bg-[#31344d] text-white hover:bg-[#3a3f56] border border-[#31344d]";

                        const Component = action.href ? Link : 'button';
                        const linkProps = action.href ? { to: action.href } : { onClick: action.onClick };

                        return (
                            <Component
                                key={index}
                                {...linkProps}
                                className={`${baseClasses} ${action.primary ? primaryClasses : secondaryClasses}`}
                            >
                                {action.icon && <span>{action.icon}</span>}
                                {action.label}
                            </Component>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Specific empty states for different scenarios
export const EmptyTransactions = () => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="📊"
            title={t('emptyStates.transactions.title')}
            description={t('emptyStates.transactions.description')}
            actions={[
                {
                    label: t('emptyStates.transactions.add_expense'),
                    href: '/add-expense',
                    icon: '💸',
                    primary: true
                },
                {
                    label: t('emptyStates.transactions.add_income'),
                    href: '/add-income',
                    icon: '💰'
                }
            ]}
        />
    );
};

export const EmptyExpenses = () => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="💸"
            title={t('emptyStates.expenses.title')}
            description={t('emptyStates.expenses.description')}
            actions={[
                {
                    label: t('emptyStates.expenses.add_first'),
                    href: '/add-expense',
                    icon: '➕',
                    primary: true
                },
                {
                    label: t('emptyStates.expenses.import_csv'),
                    onClick: () => {/* Import CSV logic */},
                    icon: '📥'
                }
            ]}
        />
    );
};

export const EmptyIncome = () => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="💰"
            title={t('emptyStates.income.title')}
            description={t('emptyStates.income.description')}
            actions={[
                {
                    label: t('emptyStates.income.add_first'),
                    href: '/add-income',
                    icon: '➕',
                    primary: true
                },
                {
                    label: t('emptyStates.income.setup_recurring'),
                    href: '/budgets',
                    icon: '🔄'
                }
            ]}
        />
    );
};

export const EmptyCategories = () => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="🏷️"
            title={t('emptyStates.categories.title')}
            description={t('emptyStates.categories.description')}
            actions={[
                {
                    label: t('emptyStates.categories.create_first'),
                    href: '/categories',
                    icon: '➕',
                    primary: true
                },
                {
                    label: t('emptyStates.categories.use_ai'),
                    onClick: () => {/* Enable AI categorization */},
                    icon: '🤖'
                }
            ]}
        />
    );
};

export const EmptyGroups = () => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="👥"
            title={t('emptyStates.groups.title')}
            description={t('emptyStates.groups.description')}
            actions={[
                {
                    label: t('emptyStates.groups.create_first'),
                    href: '/groups/create',
                    icon: '➕',
                    primary: true
                },
                {
                    label: t('emptyStates.groups.learn_more'),
                    onClick: () => {/* Show groups tutorial */},
                    icon: '📖'
                }
            ]}
        />
    );
};

export const EmptyBudgets = () => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="🎯"
            title={t('emptyStates.budgets.title')}
            description={t('emptyStates.budgets.description')}
        />
    );
};

export const EmptySearchResults = ({ query }) => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="🔍"
            title={t('emptyStates.search.title')}
            description={t('emptyStates.search.description', { query })}
            actions={[
                {
                    label: t('emptyStates.search.clear_filters'),
                    onClick: () => {/* Clear filters */},
                    icon: '🗑️',
                    primary: true
                },
                {
                    label: t('emptyStates.search.browse_all'),
                    href: '/transactions',
                    icon: '📊'
                }
            ]}
        />
    );
};

export const EmptyDashboard = () => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="🏠"
            title={t('emptyStates.dashboard.title')}
            description={t('emptyStates.dashboard.description')}
            actions={[
                {
                    label: t('emptyStates.dashboard.add_expense'),
                    href: '/add-expense',
                    icon: '💸',
                    primary: true
                },
                {
                    label: t('emptyStates.dashboard.add_income'),
                    href: '/add-income',
                    icon: '💰'
                },
                {
                    label: t('emptyStates.dashboard.watch_tutorial'),
                    onClick: () => {/* Show tutorial */},
                    icon: '🎥'
                }
            ]}
        />
    );
};

// Error states
export const ErrorState = ({ title, description, onRetry }) => {
    const { t } = useTranslation();
    
    return (
        <EmptyStateBase
            icon="⚠️"
            title={title || t('errorStates.generic.title')}
            description={description || t('errorStates.generic.description')}
            actions={[
                {
                    label: t('errorStates.generic.retry'),
                    onClick: onRetry,
                    icon: '🔄',
                    primary: true
                },
                {
                    label: t('errorStates.generic.contact_support'),
                    href: '/settings',
                    icon: '💬'
                }
            ]}
            className="bg-red-500/5 border border-red-500/10 rounded-xl"
        />
    );
};

// Loading state with skeleton
export const LoadingState = ({ message }) => {
    const { t } = useTranslation();
    
    return (
        <div className="animate-pulse space-y-4 p-6">
            <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#31344d] border-t-[#01C38D] animate-spin"></div>
            </div>
            <p className="text-center text-gray-400">
                {message || t('loadingStates.generic')}
            </p>
        </div>
    );
};

export default EmptyStateBase; 