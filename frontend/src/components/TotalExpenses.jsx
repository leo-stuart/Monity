import { useState, useEffect } from 'react'

function TotalExpenses() {
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
            setError('Please fill in all fields correctly.')
            return
        }

        fetch(`http://localhost:3000/transactions/month/${monthReq}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status ${response.status}`)
                }
                return response.json()
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
                <label>Month [MM/YY]<input type="text" pattern="\d{2}/\d{2}" value={monthReq} onChange={(e) => setMonthReq(e.target.value)} /></label>
                <button type='submit' disabled={loading}>
                    {loading ? 'Requesting...' : 'Request Total Expenses'}
                </button>
            </form>
            {total && <h2>Total expenses: ${total}</h2>}
            {error && <p style={{ color: 'red'}}>{error}</p>}
        </>
    )

}

export default TotalExpenses