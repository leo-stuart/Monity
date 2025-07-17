import { useState, useEffect } from 'react';
import { get } from '../utils/api';
import { useTranslation } from 'react-i18next';

function Balance() {
    const { t } = useTranslation();
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
            setError(t('balance.fillFieldsError'))
            return
        }

        get(`/balance/${monthReq}`)
            .then(response => {
                if (response.status !== 200) {
                    throw new Error(`HTTP error! status ${response.status}`)
                }
                return response.data;
            })
            .then(data => {
                setMessage(data.balance)
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
                <label>{t('balance.monthLabel')}<input type="text" pattern="\d{2}/\d{2}" value={monthReq} onChange={(e) => setMonthReq(e.target.value)} /></label>
                <button type='submit' disabled={loading}>
                    {loading ? t('balance.requesting') : t('balance.requestBalance')}
                </button>
            </form>
            {message && <h2>{t('balance.balanceInMonth', { message })}</h2>}
            {error && <p style={{ color: 'red'}}>{error}</p>}
        </>
    )

}

export default Balance