import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { get } from '../utils/api';
import Spinner from './Spinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FinancialProjectionsChart = () => {
  const [projections, setProjections] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjections = async () => {
      try {
        const response = await get('/projections');
        setProjections(response.data);
      } catch (err) {
        setError('Failed to load financial projections. This is a premium feature.');
      }
    };

    fetchProjections();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!projections) {
    return <Spinner message="Loading projections..." />;
  }

    if (projections.length === 0) {
    return <p>No projection data available.</p>;
  }

  const chartData = {
    labels: projections.map(p => p.date),
    datasets: [
      {
        label: 'Projected Balance',
        data: projections.map(p => p.balance),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Financial Projections for the Next 90 Days',
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default FinancialProjectionsChart; 