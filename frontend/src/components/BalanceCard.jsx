import { useState, useEffect } from "react"
import Spinner from "./Spinner"

function BalanceCard() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch('http://localhost:3000/monthly-history')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status ${response.status}`)
                }
                return response.json()
            })
            .then(data => {
                setHistory(data.data)
                setLoading(false)
            })
            .catch(error => {
                setError(error.message)
                setLoading(false)
            })

    }, [])

    let total = 0

    history.forEach(balance => {
        total += parseFloat(balance.balance)
    })

    if(loading){
        return <Spinner message="Loading balance..." />
    }
    if(error){
        return <p>Error: {error}</p>
    }

    return (
        <>
        <h2 className="text-4xl font-bold mb-4">${total.toFixed(2)}</h2>
        </>
    )
}

export default BalanceCard