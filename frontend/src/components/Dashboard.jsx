import { useState, useEffect } from "react";
import BalanceCard from "./BalanceCard";
import BalanceChart from "./BalanceChart";
import ExpenseChart from "./ExpenseChart";
import ExpensivePurchase from "./ExpensivePurchase";
import Savings from "./Savings";
import { Link } from "react-router-dom";

function CardWrapper({ children, title, accent, isLoading = false }) {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <div 
            className={`flex-1 min-w-[250px] p-6 rounded-2xl shadow-lg border border-[#31344d] bg-gradient-to-br from-[#23263a] via-[#23263a]/80 to-[#31344d] flex flex-col items-center justify-center transition-all duration-300 ${isHovered ? 'shadow-xl translate-y-[-2px]' : ''}`}
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
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full flex flex-col gap-8 mt-2">
            
            <div className="flex flex-col md:flex-row gap-6">
                <CardWrapper title="Your Balance" accent="text-[#01C38D]" isLoading={isLoading}>
                    <BalanceCard />
                </CardWrapper>
                <CardWrapper title="Total Expenses by Category" accent="text-[#01C38D]" isLoading={isLoading}>
                    <ExpenseChart />
                </CardWrapper>
                <CardWrapper title="Savings" accent="text-[#01C38D]" isLoading={isLoading}>
                    <Savings />
                </CardWrapper>
            </div>
            
            <div>
                <CardWrapper title="Balance Per Month" accent="text-[#01C38D]" isLoading={isLoading}>
                    <BalanceChart />
                </CardWrapper>
            </div>
            
            <div>
                <CardWrapper title="Most Expensive Purchases Made" accent="text-[#01C38D]" isLoading={isLoading}>
                    <ExpensivePurchase />
                </CardWrapper>
            </div>
            
            {/* Floating action button for quick access */}
            <div className="fixed bottom-8 right-8">
                <div className="relative group">
                    <button className="w-14 h-14 rounded-full bg-[#01C38D] flex items-center justify-center shadow-lg hover:bg-[#01A071] transition-colors">
                        <span className="text-[#191E29] text-2xl font-bold">+</span>
                    </button>
                    
                    <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-[#23263a] rounded-lg shadow-lg border border-[#31344d] overflow-hidden">
                            <Link to="/add-income" className="block px-4 py-2 text-[#01C38D] hover:bg-[#31344d] whitespace-nowrap transition-colors">
                                Add Income
                            </Link>
                            <Link to="/add-expense" className="block px-4 py-2 text-[#FF6384] hover:bg-[#31344d] whitespace-nowrap transition-colors">
                                Add Expense
                            </Link>
                            <Link to="/categories" className="block px-4 py-2 text-white hover:bg-[#31344d] whitespace-nowrap transition-colors">
                                Manage Categories
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;