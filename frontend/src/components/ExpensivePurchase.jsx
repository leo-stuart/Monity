import Spinner from "./Spinner"
import { useState, useEffect } from 'react';
import { get, del } from '../utils/api';

function ExpensivePurchase() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const { data } = await get('/transactions');
            const expenseData = Array.isArray(data) 
                ? data.filter(transaction => transaction.typeId === "1")
                : [];
            setExpenses(expenseData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleDelete = async (transactionId) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;

        try {
            await del(`/transactions/${transactionId}`);
            // Refetch expenses after deletion
            fetchExpenses();
        } catch(err) {
            console.error(err);
            alert("Could not delete - please try again.");
        }
    }

    if (loading) {
        return <Spinner message="Loading the most expensive purchases ..." />
    }
    if (error) {
        return <p>Error: {error}</p>
    }

    const topExpenses = expenses
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5)

    if (topExpenses.length === 0) {
        return <p>No expenses found.</p>;
    }

    return (
        <>
            <table className="w-full text-left bg-[#23263a] text-white rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-[#191E29] text-[#FF6384]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {topExpenses.map((expense) => (
                        <tr key={expense.id} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                            <td className="py-2 px-4">{expense.date}</td>
                            <td className="py-2 px-4">{expense.category}</td>
                            <td className="py-2 px-4">{expense.description}</td>
                            <td className="text-red-400 py-2 px-4">${expense.amount.toFixed(2)}</td>
                            <td className="py-2 px-4">
                                <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(expense.id)}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                                </svg></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}

export default ExpensivePurchase
