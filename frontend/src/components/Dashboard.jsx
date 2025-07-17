import { useState } from "react";
import BalanceCard from "./BalanceCard";
import BalanceChart from "./BalanceChart";
import ExpenseChart from "./ExpenseChart";
import ExpensivePurchase from "./ExpensivePurchase";
import Savings from "./Savings";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function CardWrapper({ children, title, accent, isLoading = false }) {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className={`flex-1 min-w-full sm:min-w-[250px] p-4 sm:p-6 rounded-2xl shadow-lg border border-[#31344d] bg-gradient-to-br from-[#23263a] via-[#23263a]/80 to-[#31344d] flex flex-col items-center justify-center transition-all duration-300 ${isHovered ? 'shadow-xl translate-y-[-2px]' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <h2 className={`text-2xl font-bold mb-4 ${accent}`}>{title}</h2>
            {isLoading ? (
                <div className="w-full h-40 flex justify-center items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-[#31344d] border-t-[#01C38D] animate-spin"></div>
                </div>
            ) : (
                <div className="w-full flex justify-center items-center">
                    {children}
                </div>
            )}
        </div>
    );
}

function Dashboard() {
    const { t } = useTranslation();
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

    return (
        <div className="w-full flex flex-col gap-8 mt-2">
            <div className="flex flex-col md:flex-row gap-6">
                <CardWrapper title={t('dashboard.balance_card_title')} accent="text-[#01C38D]">
                    <BalanceCard selectedRange="all_time" />
                </CardWrapper>
                <CardWrapper title={t('dashboard.expense_chart_title')} accent="text-[#01C38D]">
                    <ExpenseChart selectedRange="all_time" />
                </CardWrapper>
                <CardWrapper title={t('dashboard.savings_card_title')} accent="text-[#01C38D]">
                    <Savings selectedRange="all_time" />
                </CardWrapper>
            </div>
            
            <div>
                <CardWrapper title={t('dashboard.balance_per_month_title')} accent="text-[#01C38D]">
                    <BalanceChart selectedRange="all_time" />
                </CardWrapper>
            </div>
            
            <div>
                <CardWrapper title={t('dashboard.expensive_purchases_title')} accent="text-[#01C38D]">
                    <ExpensivePurchase selectedRange="all_time" />
                </CardWrapper>
            </div>
            
            {/* Floating action button for quick access */}
            <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
                <div className="relative group">
                    <button 
                        className="w-14 h-14 rounded-full bg-[#01C38D] flex items-center justify-center shadow-lg hover:bg-[#01A071] transition-all duration-300"
                        onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                        aria-haspopup="true"
                        aria-expanded={isFabMenuOpen}
                    >
                        <span className={`text-[#191E29] text-3xl font-bold transition-transform duration-300 ${isFabMenuOpen ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    
                    <div 
                        className={`absolute bottom-full right-0 mb-3 transition-all duration-300 ${isFabMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
                    >
                        <div className="bg-[#23263a] rounded-lg shadow-lg border border-[#31344d] overflow-hidden">
                            <Link to="/add-income" className="block px-4 py-3 text-[#01C38D] hover:bg-[#31344d] whitespace-nowrap transition-colors">
                                {t('dashboard.fab_add_income')}
                            </Link>
                            <Link to="/add-expense" className="block px-4 py-3 text-[#FF6384] hover:bg-[#31344d] whitespace-nowrap transition-colors">
                                {t('dashboard.fab_add_expense')}
                            </Link>
                            <Link to="/categories" className="block px-4 py-3 text-white hover:bg-[#31344d] whitespace-nowrap transition-colors">
                                {t('dashboard.fab_manage_categories')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;