import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FinancialProjectionsChart from './FinancialProjectionsChart';
import ExpenseForecastChart from './ExpenseForecastChart';
import NetWorth from './NetWorth';
import FinancialHealthScore from './FinancialHealthScore';
import Card from './Card';
import apiClient from '../utils/api';

const PremiumPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState({
    spendingAnalysis: null,
    subscriptions: null,
    duplicates: null,
    forecast: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPremiumData = async () => {
      try {
        const [analysisRes, subsRes, dupesRes, forecastRes] = await Promise.all([
          apiClient.get('/premium/deep-spending-analysis'),
          apiClient.get('/premium/detect-subscriptions'),
          apiClient.get('/premium/detect-duplicates'),
          apiClient.get('/premium/expense-forecast')
        ]);
        setData({
          spendingAnalysis: analysisRes.data.analysis,
          subscriptions: subsRes.data.potentialSubscriptions,
          duplicates: dupesRes.data.potentialDuplicates,
          forecast: forecastRes.data.forecast,
        });
      } catch (err) {
        setError(err.response?.data?.error || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">{t('premium.title')}</h1>
      <p className="text-md md:text-lg text-gray-300 mb-8">{t('premium.description')}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card title={t('premium.financial_health_title')}>
            <FinancialHealthScore />
          </Card>
        </div>
        <Card title={t('premium.projections_title')}>
          <FinancialProjectionsChart />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        <Card title={t('premium.spending_analysis_title')}>
          {data.spendingAnalysis && data.spendingAnalysis.length > 0 ? (
            <ul>{data.spendingAnalysis.map((item, index) => <li key={index} className="mb-2">{item.message}</li>)}</ul>
          ) : <p>{t('premium.no_significant_spending_changes')}</p>}
        </Card>
        <Card title={t('premium.subscriptions_title')}>
          {data.subscriptions && data.subscriptions.length > 0 ? (
            <ul>{data.subscriptions.map((item, index) => <li key={index} className="mb-2">{item.message}</li>)}</ul>
          ) : <p>{t('premium.no_subscriptions_found')}</p>}
        </Card>
        <Card title={t('premium.duplicates_title')}>
          {data.duplicates && data.duplicates.length > 0 ? (
            <ul>{data.duplicates.map((item) => <li key={item.id} className="mb-2">{item.description} - ${item.amount} on {new Date(item.date).toLocaleDateString()}<p className="text-sm text-gray-400">{item.message}</p></li>)}</ul>
          ) : <p>{t('premium.no_duplicates_found')}</p>}
        </Card>
      </div>

      <div className="mt-8">
        <Card title={t('premium.forecast_title')}>
          {data.forecast && data.forecast.length > 0 ? <ExpenseForecastChart data={data.forecast} /> : <p>{t('premium.no_forecast_data')}</p>}
        </Card>
      </div>

      <div className="mt-8">
        <Card title={t('premium.net_worth_title')}>
            <NetWorth />
        </Card>
      </div>
    </div>
  );
};

export default PremiumPage; 