import React from 'react';
import { useTranslation } from 'react-i18next';

const Premium = () => {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">{t('premium.title')}</h1>
      <p className="text-lg text-gray-300">
        {t('premium.description')}
      </p>
      {/* Add premium feature components here */}
    </div>
  );
};

export default Premium; 