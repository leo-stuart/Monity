import { useState, useEffect } from 'react';
import { get } from '../utils/api';
import Spinner from './Spinner';

function AdminDashboard() {
  const [stats, setStats] = useState({
    userCount: 0,
    transactionCount: 0,
    totalVolume: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userCountRes, allTransactionsRes] = await Promise.all([
          get('/users/count'),
          get('/transactions/all'),
        ]);

        const userCount = userCountRes.data.count;
        const transactions = allTransactionsRes.data;
        
        const transactionCount = transactions.length;
        const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

        setStats({ userCount, transactionCount, totalVolume });
      } catch (err) {
        setError('Failed to fetch admin statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return <Spinner message="Loading admin dashboard..." />;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="text-white p-4 md:p-0">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-[#23263a] to-[#31344d] p-4 md:p-6 rounded-2xl shadow-lg border border-[#31344d]">
          <h2 className="text-md md:text-lg font-semibold text-gray-400 mb-2">Total Users</h2>
          <p className="text-3xl md:text-4xl font-bold text-[#01C38D]">{stats.userCount}</p>
        </div>
        <div className="bg-gradient-to-br from-[#23263a] to-[#31344d] p-4 md:p-6 rounded-2xl shadow-lg border border-[#31344d]">
          <h2 className="text-md md:text-lg font-semibold text-gray-400 mb-2">Total Transactions</h2>
          <p className="text-3xl md:text-4xl font-bold text-[#36A2EB]">{stats.transactionCount}</p>
        </div>
        <div className="bg-gradient-to-br from-[#23263a] to-[#31344d] p-4 md:p-6 rounded-2xl shadow-lg border border-[#31344d]">
          <h2 className="text-md md:text-lg font-semibold text-gray-400 mb-2">Total Volume</h2>
          <p className="text-3xl md:text-4xl font-bold text-[#FF6384]">${stats.totalVolume.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 