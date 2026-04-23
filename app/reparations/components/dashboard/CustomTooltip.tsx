"use client";

import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: any;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{data.fullName || data.name}</p>
        <p className="text-blue-600">
          <span className="font-medium">Total: {data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
