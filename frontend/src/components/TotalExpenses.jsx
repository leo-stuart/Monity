import { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { useTranslation } from 'react-i18next';

function TotalExpenses() {
    const { t } = useTranslation();
    const [monthReq, setMonthReq] = useState('')
    const [total, setTotal] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const HandleSubmit = (e) => {
        setLoading(true)
        setTotal(null)
        setError(null)

        e.preventDefault()
        if (!monthReq) {
            setError(t('totalExpenses.fillFieldsError'))
            return
        }

        apiClient.get(`/transactions/month/${monthReq}`)
            .then(response => {
                if (response.status !== 200) {
                    throw new Error(`HTTP error! status ${response.status}`)
                }
                return response.data;
            })
            .then(data => {
                // Calculate total expenses from the transactions
                const totalExpenses = data
                    .filter(transaction => transaction.typeId === "1") // Filter expense type
                    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                setTotal(totalExpenses.toFixed(2))
                setMonthReq('')
                setLoading(false)
            })
            .catch(error => {
                setError(error.message)
                setMonthReq('')
                setLoading(false)
            })
    }

    useEffect(() => {
        if (total || error) {
            const timer = setTimeout(() => {
                setTotal(null)
                setError(null)
            }, 10000)
            return () => clearTimeout(timer)
        }
    }, [total, error])

    return (
        <>
            <form onSubmit={HandleSubmit}>
                <label>{t('totalExpenses.monthLabel')}<input type="text" pattern="\d{2}/\d{2}" value={monthReq} onChange={(e) => setMonthReq(e.target.value)} /></label>
                <button type='submit' disabled={loading}>
                    {loading ? t('totalExpenses.requesting') : t('totalExpenses.requestTotal')}
                </button>
            </form>
            {total && <h2>{t('totalExpenses.totalExpenses', { total })}</h2>}
            {error && <p style={{ color: 'red'}}>{error}</p>}
        </>
    )

}

export default TotalExpenses