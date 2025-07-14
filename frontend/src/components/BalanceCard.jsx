import { useState, useEffect } from "react"
import Spinner from "./Spinner"
import { get } from "../utils/api"

function BalanceCard() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchMonths = async () => {
            try {
                const { data } = await get('/months');
                setHistory(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMonths();
    }, []);

    const [totalBalance, setTotalBalance] = useState(0);

    useEffect(() => {
        if (!history.length) return;
        
        const fetchAllBalances = async () => {
            setLoading(true);
            try {
                const balancePromises = history.map(month => get(`/balance/${month}`));
                const balanceResponses = await Promise.all(balancePromises);
                const total = balanceResponses.reduce((acc, response) => acc + (response.data.balance || 0), 0);
                setTotalBalance(total);
            } catch (err) {
                console.error('Error fetching balances:', err);
                setError('Failed to calculate total balance');
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllBalances();
    }, [history]);

    if(loading){
        return <Spinner message="Loading balance..." />
    }
    if(error){
        return <p>Error: {error}</p>
    }

    return (
        <>
        <h2 className="text-4xl font-bold mb-4">${totalBalance.toFixed(2)}</h2>
        </>
    )
}

export default BalanceCard