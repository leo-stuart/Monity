import React from 'react';
import { useTranslation } from 'react-i18next';

function DateRangeFilter({ selectedRange, setSelectedRange }) {
  const { t } = useTranslation();
  return (
    <div className="w-full md:w-auto md:flex md:justify-end mb-4">
      <label htmlFor="date-range-filter" className="sr-only">{t('dateRangeFilter.label')}</label>
      <select
        id="date-range-filter"
        value={selectedRange}
        onChange={(e) => setSelectedRange(e.target.value)}
        className="w-full md:w-auto bg-[#23263a] text-white border border-[#31344d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#01C38D]"
      >
        <option value="current_month">{t('dateRangeFilter.currentMonth')}</option>
        <option value="all_time">{t('dateRangeFilter.allTime')}</option>
      </select>
    </div>
  );
}

export default DateRangeFilter; 