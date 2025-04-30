import { useState, useEffect } from 'react';

function AddIncome(){
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(null);
    
    const HandleSubmit = (e) => {
        setLoading(true);
        setMessage(null);
        setError(null);
        
        e.preventDefault();
        if(!category.trim() || amount <= 0 || !date){
            setError('Please fill in all fields correctly.')
            return
        }
        
        const formatDate = (inputDate) => {
            if (!inputDate) return "";
            const [year, month, day] = inputDate.split('-');
            return `${day}/${month}/${year.slice(2)}`;
        };
        
        const formattedDate = formatDate(date);
        
        const incomeData = { category, amount, date: formattedDate };


        fetch('http://localhost:3000/add-income', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incomeData)
        })
            .then(response => {
                if(!response.ok){
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setMessage(data.message);
                setCategory('');
                setAmount(0);
                setDate('');
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setCategory('');
                setAmount('');
                setDate('');
                setLoading(false);
            })
    }

    useEffect(() => {
        if(message || error){
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
                <label>Income Category <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required /></label>
                <label>Income Amount <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
                <label>Income Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
                <button type='submit' disabled={loading}>
                    {loading ? 'Adding...' : 'Add Income'}
                </button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </>
    )
    
}

export default AddIncome;