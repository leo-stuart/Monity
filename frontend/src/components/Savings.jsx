import { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { get } from '../utils/api';

function Savings({ selectedRange }) {
    const [totalSavings, setTotalSavings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSavings = async () => {
            setLoading(true);
            setError(null);
            try {
                let response;
                if (selectedRange === "current_month") {
                    const now = new Date();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const year = now.getFullYear();
                    response = await get(`/transactions/month/${month}/${year}`);
                } else { // 'all_time'
                    response = await get('/transactions');
                }

                if (!Array.isArray(response.data)) {
                    setTotalSavings(0);
                    return;
                }

                const savingsTransactions = response.data.filter(t => t.typeId === "3");
                
                const total = savingsTransactions.reduce((acc, transaction) => {
                    const amount = parseFloat(transaction.amount);
                    if (transaction.category === "Make Investments") {
                        return acc - amount;
                    } else if (transaction.category === "Withdraw Investments") {
                        return acc + amount;
                    }
                    return acc;
                }, 0);

                setTotalSavings(total);

            } catch(err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSavings();
    }, [selectedRange]);

    // Handle loading and error states
    if (loading) {
        return <Spinner message="Loading savings..." />;
    }
    if (error) {
        return <p className="text-red-500">Error: {error}</p>;
    }

    return (
        <h2 className="text-4xl font-bold mb-4">${totalSavings.toFixed(2)}</h2>
    );
}

export default Savings;