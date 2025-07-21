import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Unified top navigation bar with breadcrumbs, search, and user menu
 * Replaces the inconsistent navigation systems
 */
const UnifiedTopBar = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, subscriptionTier } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const userMenuRef = useRef(null);
    const searchRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Quick navigation suggestions based on search
    const getQuickActions = (query) => {
        const lowerQuery = query.toLowerCase();
        const actions = [
            { path: '/add-expense', label: t('quickActions.add_expense'), icon: '💸', keywords: ['expense', 'despesa', 'add', 'new', 'criar'] },
            { path: '/add-income', label: t('quickActions.add_income'), icon: '💰', keywords: ['income', 'receita', 'salary', 'salario'] },
            { path: '/transactions', label: t('quickActions.view_transactions'), icon: '📊', keywords: ['transaction', 'history', 'historico'] },
            { path: '/budgets', label: t('quickActions.manage_budgets'), icon: '🎯', keywords: ['budget', 'orcamento', 'limit'] },
            { path: '/groups', label: t('quickActions.view_groups'), icon: '👥', keywords: ['group', 'grupo', 'split', 'shared'] },
            { path: '/categories', label: t('quickActions.manage_categories'), icon: '🏷️', keywords: ['category', 'categoria', 'organize'] },
            { path: '/settings', label: t('quickActions.settings'), icon: '⚙️', keywords: ['settings', 'configuracoes', 'profile'] },
        ];

        if (!query) return actions.slice(0, 4); // Show top 4 when no search

        return actions.filter(action => 
            action.keywords.some(keyword => keyword.includes(lowerQuery)) ||
            action.label.toLowerCase().includes(lowerQuery)
        ).slice(0, 6);
    };

    // Generate breadcrumbs from current path
    const getBreadcrumbs = () => {
        const pathMap = {
            '/': t('sidebar.dashboard'),
            '/transactions': t('sidebar.transactions'),
            '/add-expense': t('addExpense.title'),
            '/add-income': t('addIncome.title'),
            '/groups': t('sidebar.groups'),
            '/categories': t('sidebar.categories'),
            '/budgets': t('sidebar.budgets'),
            '/settings': t('sidebar.settings'),
            '/premium': t('sidebar.premium'),
            '/subscription': t('sidebar.subscription'),
            '/admin': t('sidebar.admin_dashboard'),
            '/savings-goals': t('sidebar.savings_goals'),
        };

        const segments = location.pathname.split('/').filter(Boolean);
        const breadcrumbs = [{ path: '/', label: t('sidebar.dashboard') }];

        let currentPath = '';
        segments.forEach(segment => {
            currentPath += `/${segment}`;
            const label = pathMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
            breadcrumbs.push({ path: currentPath, label });
        });

        return breadcrumbs;
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleQuickActionSelect = (path) => {
        navigate(path);
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const breadcrumbs = getBreadcrumbs();
    const quickActions = getQuickActions(searchQuery);

    return (
        <header className="sticky top-0 z-50 bg-[#191E29] border-b border-[#31344d] shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left Section: Logo + Breadcrumbs */}
                <div className="flex items-center gap-4 flex-1">
                    {/* Mobile menu toggle */}
                    <button
                        onClick={onMobileMenuToggle}
                        className="md:hidden text-white hover:text-[#01C38D] transition-colors p-1"
                        aria-label={t('topbar.toggle_menu')}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-[#01C38D] hover:text-[#01C38D]/80 transition-colors">
                        <span className="text-xl font-bold">Monity</span>
                        {subscriptionTier === 'premium' && (
                            <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-medium">PRO</span>
                        )}
                    </Link>

                    {/* Breadcrumbs - Hidden on small screens */}
                    <nav className="hidden lg:flex items-center text-sm" aria-label="Breadcrumb">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.path} className="flex items-center">
                                {index > 0 && (
                                    <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="text-white font-medium">{crumb.label}</span>
                                ) : (
                                    <Link
                                        to={crumb.path}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {crumb.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Center Section: Search */}
                <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
                    <div className="relative">
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="w-full bg-[#23263a] border border-[#31344d] rounded-lg px-4 py-2 text-left text-gray-400 hover:border-[#01C38D] transition-colors focus:outline-none focus:border-[#01C38D]"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="hidden sm:inline">{t('topbar.quick_search')}</span>
                                <span className="ml-auto text-xs bg-[#31344d] px-2 py-1 rounded hidden md:inline">⌘K</span>
                            </div>
                        </button>

                        {isSearchOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#23263a] border border-[#31344d] rounded-lg shadow-lg overflow-hidden">
                                <div className="p-3 border-b border-[#31344d]">
                                    <input
                                        type="text"
                                        placeholder={t('topbar.search_placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#191E29] border border-[#31344d] rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#01C38D]"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {quickActions.map((action, index) => (
                                        <button
                                            key={action.path}
                                            onClick={() => handleQuickActionSelect(action.path)}
                                            className="w-full text-left px-4 py-3 hover:bg-[#31344d] transition-colors border-b border-[#31344d] last:border-b-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{action.icon}</span>
                                                <span className="text-white">{action.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Language + User Menu */}
                <div className="flex items-center gap-3">
                    {/* Language Switcher - Hidden on mobile */}
                    <div className="hidden sm:block">
                        <LanguageSwitcher />
                    </div>

                    {/* User Menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#31344d] transition-colors"
                        >
                            <div className="w-8 h-8 bg-[#01C38D] rounded-full flex items-center justify-center shadow-md">
                                <span className="text-[#191E29] text-sm font-bold">
                                    {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : '👤'}
                                </span>
                            </div>
                            <span className="hidden md:inline text-white font-medium">
                                {user?.user_metadata?.name || t('sidebar.user')}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isUserMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-[#23263a] border border-[#31344d] rounded-lg shadow-lg overflow-hidden">
                                <div className="p-4 border-b border-[#31344d]">
                                    <p className="text-white font-medium">{user?.user_metadata?.name || t('sidebar.user')}</p>
                                    <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                                    {subscriptionTier === 'premium' && (
                                        <span className="inline-block mt-1 text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-medium">Premium</span>
                                    )}
                                </div>
                                <div className="py-2">
                                    <Link
                                        to="/settings"
                                        className="block px-4 py-2 text-white hover:bg-[#31344d] transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {t('sidebar.settings')}
                                        </div>
                                    </Link>
                                    <div className="block sm:hidden">
                                        <div className="px-4 py-2 border-t border-[#31344d]">
                                            <LanguageSwitcher />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-[#31344d] transition-colors border-t border-[#31344d]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            {t('sidebar.logout')}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default UnifiedTopBar; 