import { useState, useEffect } from 'react';

function AddExpense() {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const HandleSubmit = (e) => {
        setLoading(true);
        setMessage(null);
        setError(null);

        e.preventDefault();
        if(!description.trim() || amount <= 0 || !category.trim() || !date){
            setError('Please fill in all fields correctly.')
            return
        }

        const formatDate = (inputDate) => {
            if (!inputDate) return "";
            const [year, month, day] = inputDate.split('-');
            return `${day}/${month}/${year.slice(2)}`;
        };
        
        const formattedDate = formatDate(date);

        const expenseData = { description, amount, category, date: formattedDate };

        fetch('http://localhost:3000/add-expense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json()
            })
            .then(data => {
                setMessage(data.message);
                setDescription('');
                setAmount(0);
                setCategory('');
                setDate('');
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setDescription('');
                setAmount('');
                setCategory('');
                setDate('');
                setLoading(false);
            })
        }
        useEffect(() => {
            if(message || error) {
                const timer = setTimeout(() => {
                    setMessage(null);
                    setError(null);
                }, 3000)
                return () => clearTimeout(timer);
            }
        }, [message, error]);

    return (
        <>
            <form onSubmit={HandleSubmit}>
                <label>Expense Description <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
                <label>Expense Amount <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
                <label>Expense Category <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required /></label>
                <label>Expense Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
                <button type='submit' disabled={loading}>
                    {loading ? 'Adding...' : 'Add Expense'}
                </button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </>
    )
}


export default AddExpense;