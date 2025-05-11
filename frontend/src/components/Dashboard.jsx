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

function RecentTransactions() {
    //Make the fetch request to the backend
    const transactions = [
        { date: '04/10/25', description: 'Groceries', category: 'Food', amount: 150.75 },
        { date: '04/03/25', description: 'Pizza', category: 'Food', amount: 22.50 },
        { date: '31/03/25', description: 'Mochila faculdade', category: 'Acessorio', amount: 150.00 },
        { date: '31/03/25', description: 'Tenis yeezy', category: 'Roupas', amount: 200.00 },
    ];
    return (
        <div className="bg-[#23263a] rounded-xl shadow-lg p-6 mt-8">
            <h3 className="font-bold mb-4 text-lg text-[#01C38D]">Recent Transactions</h3>
            <table className="w-full text-left bg-[#23263a] text-white rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-[#191E29] text-[#01C38D]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx, i) => (
                        <tr key={i} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                            <td className="py-2 px-4">{tx.date}</td>
                            <td className="py-2 px-4">{tx.description}</td>
                            <td className="py-2 px-4">{tx.category}</td>
                            <td className="py-2 px-4">${tx.amount.toFixed(2)}</td>
                            <td className="py-2 px-4">
                                <button className="text-red-400 hover:text-red-300 font-semibold transition-colors">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
                {/* <RecentTransactions /> */}
            </div>
        </div>
    )
}

export default Dashboard