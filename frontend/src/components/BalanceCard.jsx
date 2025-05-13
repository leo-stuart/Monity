import { useState, useEffect } from "react"
import Spinner from "./Spinner"
import { getToken } from "../utils/api"

function BalanceCard() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setError('Authentication required');
            setLoading(false);
            return;
        }

        fetch('http://localhost:3000/months', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status ${response.status}`)
                }
                return response.json()
            })
            .then(data => {
                // data will be an array of month strings
                setHistory(data);
                setLoading(false)
            })
            .catch(error => {
                setError(error.message)
                setLoading(false)
            })
    }, [])

    // Initialize total balance
    const [totalBalance, setTotalBalance] = useState(0);

    // Fetch balance for each month and calculate total
    useEffect(() => {
        if (!history.length || loading) return;
        
        const token = getToken();
        if (!token) return;
        
        let total = 0;
        let completedRequests = 0;
        
        // Create a function to fetch balance for a single month
        const fetchMonthBalance = async (month) => {
            try {
                const response = await fetch(`http://localhost:3000/balance/${month}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status ${response.status}`);
                }
                
                const data = await response.json();
                return data.balance || 0;
            } catch (error) {
                console.error(`Error fetching balance for ${month}:`, error);
                return 0;
            }
        };
        
        // Process each month and update total
        const processAllMonths = async () => {
            setLoading(true);
            let sum = 0;
            
            for (const month of history) {
                const balance = await fetchMonthBalance(month);
                sum += parseFloat(balance);
            }
            
            setTotalBalance(sum);
            setLoading(false);
        };
        
        processAllMonths();
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