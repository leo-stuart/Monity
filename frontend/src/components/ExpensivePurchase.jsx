import Spinner from "./Spinner"
import { useState, useEffect, useCallback } from 'react';
import { get, del } from '../utils/api';
import formatDate from "../utils/formatDate";
import { useTranslation } from "react-i18next";

function ExpensivePurchase({ selectedRange }) {
    const { t } = useTranslation();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let response;
            if (selectedRange === "current_month") {
                const now = new Date();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = String(now.getFullYear());
                response = await get(`/transactions/month/${month}/${year}`);
            } else { // 'all_time'
                response = await get('/transactions');
            }

            const expenseData = Array.isArray(response.data) 
                ? response.data.filter(transaction => transaction.typeId === 1)
                : [];
            setExpenses(expenseData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedRange]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleDelete = async (transactionId) => {
        if (!window.confirm(t('expensive_purchase.confirm_delete'))) return;

        try {
            await del(`/transactions/${transactionId}`);
            // Refetch expenses after deletion, respecting the current filter
            fetchExpenses();
        } catch(err) {
            console.error(err);
            alert(t('expensive_purchase.delete_error'));
        }
    }

    if (loading) {
        return <Spinner message={t('expensive_purchase.loading')} />
    }
    if (error) {
        return <p>{t('expensive_purchase.error')}: {error}</p>
    }

    const topExpenses = expenses
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 5)

    if (topExpenses.length === 0) {
        return <p className="text-white text-center py-4">{t('expensive_purchase.no_expenses')}</p>;
    }

    return (
        <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden md:block">
                <table className="w-full text-left bg-transparent text-white rounded-lg">
                    <thead>
                        <tr className="bg-transparent text-[#FF6384]">
                            <th className="py-3 px-4">{t('expensive_purchase.date')}</th>
                            <th className="py-3 px-4">{t('expensive_purchase.category')}</th>
                            <th className="py-3 px-4">{t('expensive_purchase.description')}</th>
                            <th className="py-3 px-4 text-right">{t('expensive_purchase.amount')}</th>
                            <th className="py-3 px-4 text-center">{t('expensive_purchase.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topExpenses.map((expense) => (
                            <tr key={expense.id} className="border-t border-[#31344d] hover:bg-[#2a2d44] transition-colors">
                                <td className="py-3 px-4">{formatDate(expense.date)}</td>
                                <td className="py-3 px-4">{expense.category}</td>
                                <td className="py-3 px-4">{expense.description}</td>
                                <td className="text-red-400 py-3 px-4 text-right">${expense.amount.toFixed(2)}</td>
                                <td className="py-3 px-4 text-center">
                                    <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(expense.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash3-fill" viewBox="0 0 16 16">
                                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.024l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3.5-.012l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m3.5-.012l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {topExpenses.map((expense) => (
                    <div key={expense.id} className="bg-[#191E29] p-4 rounded-lg border border-[#31344d]">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-white text-lg">{expense.description}</p>
                                <p className="text-sm text-gray-400">{expense.category}</p>
                            </div>
                            <p className="text-red-400 font-bold text-lg">${expense.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">{formatDate(expense.date)}</p>
                            <button className="text-red-400 hover:text-red-300 font-semibold transition-colors" onClick={() => handleDelete(expense.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ExpensivePurchase;
