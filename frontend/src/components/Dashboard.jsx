import BalanceCard from "./BalanceCard";
import BalanceChart from "./BalanceChart";
import ExpenseChart from "./ExpenseChart";
import ExpensivePurchase from "./ExpensivePurchase";

function Dashboard() {
    return (
        <div className="Dashboard">
            <h1>Dashboard</h1>
            <div className="dashboard-grid">
                <div className="balance-card">
                    <h2>Your Balance</h2>
                    <BalanceCard />
                </div>

                <div className="expenses-category-chart">
                    <h2>Total Expenses by Category</h2>
                    <ExpensivePurchase />
                </div>

                <div className="balance-evolution-graph">
                    <h2>Balance Evolution</h2>
                    <BalanceChart />
                </div>

                <div className="most-expensive">
                    <h2>Most Expensive Purchases Made</h2>
                    <ExpenseChart />
                </div>
            </div>
        </div>
    )
}

export default Dashboard