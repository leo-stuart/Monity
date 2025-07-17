import { useState, useEffect } from "react";
import Spinner from "./Spinner";
import { get } from "../utils/api";
import { useTranslation } from "react-i18next";

function BalanceCard({ selectedRange }) {
    const { t } = useTranslation();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBalance = async () => {
            setLoading(true);
            setError(null);
            try {
                let response;
                if (selectedRange === "current_month") {
                    const now = new Date();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const year = now.getFullYear();
                    response = await get(`/balance/${month}/${year}`);
                } else { // 'all_time'
                    response = await get('/balance/all');
                }
                setBalance(response.data.balance || 0);
            } catch (err) {
                console.error("Error fetching balance:", err);
                setError(t('balanceCard.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [selectedRange, t]);

    if (loading) {
        return <Spinner message={t('balanceCard.loading')} />;
    }
    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <h2 className="text-4xl font-bold mb-4">${balance.toFixed(2)}</h2>
    );
}

export default BalanceCard;