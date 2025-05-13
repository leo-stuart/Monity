import { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { getToken } from '../utils/api';

function Savings() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        fetch('http://localhost:3000/transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // API returns transactions directly, not wrapped in data.data
                setTransactions(data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    // Handle loading and error states
    if (loading) {
        return <Spinner message="Loading savings..." />;
    }
    if (error) {
        return <p>Error: {error}</p>;
    }

    // Ensure transactions is an array before filtering
    if (!Array.isArray(transactions)) {
        return <p>No transaction data available.</p>;
    }

    // Filter transactions by category and type
    const savings = transactions.filter(transaction => 
        transaction.category === "Make Investments" && transaction.typeId === "1"
    );
    
    const withdrawals = transactions.filter(transaction => 
        transaction.category === "Withdraw Investments" && transaction.typeId === "2"
    );

    // Calculate totals
    let investmentsTotal = 0;
    savings.forEach(expense => {
        investmentsTotal += parseFloat(expense.amount);
    });

    let withdrawalsTotal = 0;
    withdrawals.forEach(income => {
        withdrawalsTotal += parseFloat(income.amount);
    });

    let totalSavings = investmentsTotal - withdrawalsTotal;

    return (
        <>
            <h2 className="text-4xl font-bold mb-4">${Math.abs(totalSavings).toFixed(2)}</h2>
        </>
    );
}

export default Savings;