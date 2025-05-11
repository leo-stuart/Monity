import BalanceCard from "./BalanceCard";
import BalanceChart from "./BalanceChart";
import ExpenseChart from "./ExpenseChart";
import ExpensivePurchase from "./ExpensivePurchase";

function CardWrapper({ children, title, accent }) {
    return (
        <div className="flex-1 min-w-[250px] p-6 rounded-2xl shadow-lg border border-[#23263a] bg-gradient-to-br from-[#23263a] via-[#23263a]/80 to-[#31344d] flex flex-col items-center justify-center">
            <h2 className={`text-2xl font-bold mb-4 ${accent}`}>{title}</h2>
            <div className="w-full flex justify-center items-center">
                {children}
            </div>
        </div>
    );
}

function Dashboard() {
    return (
        <div className="w-full flex flex-col gap-8 mt-8">
            <div className="flex flex-col md:flex-row gap-6">
                <CardWrapper title="Your Balance" accent="text-[#01C38D]">
                    <BalanceCard />
                </CardWrapper>
                <CardWrapper title="Total Expenses by Category" accent="text-[#FF6384]">
                    <ExpenseChart />
                </CardWrapper>
                <CardWrapper title="Savings" accent="text-[#FFCE56]">
                    <h2>Savings</h2>
                </CardWrapper>
            </div>
            <div>
                <CardWrapper title="Balance Evolution" accent="text-[#FFCE56]">
                    <BalanceChart />
                </CardWrapper>
            </div>
            <div>
                <CardWrapper title="Most Expensive Purchases Made" accent="text-[#36A2EB]">
                    <ExpensivePurchase />
                </CardWrapper>
            </div>
        </div>
    )
}

export default Dashboard