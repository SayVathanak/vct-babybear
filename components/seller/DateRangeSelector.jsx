'use client';
import React, { useState } from 'react';

const DateRangeSelector = ({ onDateRangeChange }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (startDate && endDate) {
      onDateRangeChange({
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      setIsCalendarOpen(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className="flex items-center justify-center w-full px-2 py-2 sm:px-3 bg-gray-50 rounded-md text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {/* Filter Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="hidden md:inline whitespace-nowrap">
          {startDate && endDate 
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : "Custom Date Range"}
        </span>
      </button>

      {isCalendarOpen && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-4 w-64">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="start-date" className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || today}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="end-date" className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={today}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-3 py-1 text-xs text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!startDate || !endDate}
                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;