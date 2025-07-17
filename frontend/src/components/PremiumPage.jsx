import React from 'react';
import { useTranslation } from 'react-i18next';
import FinancialProjectionsChart from './FinancialProjectionsChart';

const PremiumPage = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-4">{t('premium.title')}</h1>
      <p className="text-md md:text-lg text-gray-300 mb-8">
        {t('premium.description')}
      </p>
      <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg text-white">
        <h2 className="text-xl md:text-2xl font-bold mb-4">{t('premium.projections_title')}</h2>
        <FinancialProjectionsChart />
      </div>
    </div>
  );
};

export default PremiumPage; 