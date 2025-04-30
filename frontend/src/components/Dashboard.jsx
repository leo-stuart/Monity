import BalanceCard from "./BalanceCard";
import BalanceChart from "./BalanceChart";
import ExpenseChart from "./ExpenseChart";
import ExpensivePurchase from "./ExpensivePurchase";

function Dashboard() {
    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 ">
                <div className="bg-white p-6 rounded shadow">
                    <h2>Your Balance</h2>
                    <BalanceCard />
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2>Most Expensive Purchases Made</h2>
                    <ExpenseChart />
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2>Total Expenses by Category</h2>
                    <ExpensivePurchase />
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2>Balance Evolution</h2>
                    <BalanceChart />
                </div>

        </div>
    )
}

export default Dashboard