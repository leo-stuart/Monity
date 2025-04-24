import { useState, useEffect } from 'react'

function Balance() {
    const [monthReq, setMonthReq] = useState('')
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const HandleSubmit = (e) => {
        setLoading(true)
        setMessage(null)
        setError(null)

        e.preventDefault()
        if (!monthReq) {
            setError('Please fill in all fields correctly.')
            return
        }

        fetch('http://localhost:3000/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthReq })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status ${response.status}`)
                }
                return response.json()
            })
            .then(data => {
                setMessage(data.message)
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
        if (message || error) {
            const timer = setTimeout(() => {
                setMessage(null)
                setError(null)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [message, error])

    return (
        <>
            <form onSubmit={HandleSubmit}>
                <label>Month [MM/YY]<input type="text" pattern="\d{2}/\d{2}" value={monthReq} onChange={(e) => setMonthReq(e.target.value)} /></label>
                <button type='submit' disabled={loading}>
                    {loading ? 'Requesting...' : 'Request Balance'}
                </button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red'}}>{error}</p>}
        </>
    )

}

export default Balance