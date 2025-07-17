import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Spinner from './Spinner'
import { get, del } from '../utils/api'
import formatDate from '../utils/formatDate';
import { useTranslation } from 'react-i18next';

function ListExpenses() {
    const { t } = useTranslation();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');

    const handleDelete = async (transactionId) => {
        if (!window.confirm(t('expense_list.confirm_delete'))) return

        try {
            await del(`/transactions/${transactionId}`);
            setExpenses(prev => prev.filter(expense => expense.id !== transactionId))
        } catch(err) {
            console.error(err)
            alert(t('expense_list.delete_failed'))
        }
    }

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const { data } = await get('/transactions');
                const expenseData = Array.isArray(data)
                    ? data.filter(transaction => transaction.typeId === 1)
                    : [];
                setExpenses(expenseData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenses();
    }, []);

    const filtered = expenses
        .filter(expense => (
            (category === '' ? true : expense.category.toLowerCase().includes(category.toLowerCase()))
        ))
        .filter(expense => (
            (date === '' ? true : expense.date.startsWith(date))
        ))

    let sum = 0
    filtered.forEach(expense => {
        sum += parseFloat(expense.amount)
    })

    const reversedExpenses = [...filtered].reverse();
    if (!filtered.length) {
        return (
            <div className="bg-[#23263a] border-1 p-4 rounded-xl shadow-lg shadow-red-400 ring-2 ring-red-400/50">
                <div className='flex flex-col md:flex-row items-center justify-between gap-6 mb-4'>
                    <h3 className="text-lg font-bold text-[#FF6384]">{t('expense_list.total_expenses')}: <span className="text-white">${sum.toFixed(2)}</span></h3>
                    <div className="flex gap-2">
                        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#FF6384] focus:border-[#FF6384] block w-full p-2.5 placeholder-gray-400" placeholder={t('expense_list.placeholder_category')} />
                        <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#FF6384] focus:border-[#FF6384] block w-full p-2.5 placeholder-gray-400" placeholder={t('expense_list.placeholder_date')} />
                    </div>
                    <Link
                        to="/add-expense"
                        className="inline-block text-white hover:text-[#23263a] bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-red-300 shadow-lg shadow-red-500/50 dark:shadow-red-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 focus:outline-none focus:ring-0 focus:shadow-none transition-colors">
                        {t('expense_list.add_expense')}
                    </Link>
                </div>
                <p>{t('expense_list.no_expenses')}</p>
            </div>
        )
    }
    if (loading) {
        return <Spinner message={t('expense_list.loading')} />
    }
    if (error) {
        return <p>{t('expense_list.error')}: {error}</p>
    }

    return (
        <div className="bg-[#23263a] p-4 rounded-xl shadow-lg ring-2 ring-red-400/50">
            {/* Header */}
            <div className='flex flex-col md:flex-row items-center justify-between gap-4 mb-4'>
                <h3 className="text-lg font-bold text-white">{t('expense_list.total_expenses')}: <span className="text-[#FF6384]">${sum.toFixed(2)}</span></h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#FF6384] focus:border-[#FF6384] block w-full p-2.5 placeholder-gray-400" placeholder={t('expense_list.filter_category')} />
                    <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="bg-[#191E29] border border-[#31344d] text-white text-sm rounded-lg focus:ring-[#FF6384] focus:border-[#FF6384] block w-full p-2.5 placeholder-gray-400" placeholder={t('expense_list.filter_date')} />
                </div>
                <Link
                    to="/add-expense"
                    className="w-full md:w-auto text-center text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/50 font-medium rounded-lg text-sm px-5 py-2.5 transition-all">
                    {t('expense_list.add_expense')}
                </Link>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <table className="w-full text-left bg-[#23263a] text-white rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-[#191E29] text-[#FF6384]">
                            <th className="py-3 px-4">{t('expense_list.date')}</th>
                            <th className="py-3 px-4">{t('expense_list.category')}</th>
                            <th className="py-3 px-4">{t('expense_list.description')}</th>
                            <th className="py-3 px-4 text-right">{t('expense_list.amount')}</th>
                            <th className="py-3 px-4 text-center">{t('expense_list.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reversedExpenses.map((expense) => (
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
                {reversedExpenses.map((expense) => (
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
};

export default ListExpenses;