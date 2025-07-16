import React from 'react';

function DateRangeFilter({ selectedRange, setSelectedRange }) {
  return (
    <div className="flex justify-end mb-4">
      <select
        value={selectedRange}
        onChange={(e) => setSelectedRange(e.target.value)}
        className="bg-[#23263a] text-white border border-[#31344d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#01C38D]"
      >
        <option value="current_month">Current Month</option>
        <option value="all_time">All Time</option>
      </select>
    </div>
  );
}

export default DateRangeFilter; 