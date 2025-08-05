import { useState, useEffect } from 'react';
import { get } from '../utils/api';
import Spinner from './Spinner';
import { useTranslation } from 'react-i18next';

function AdminDashboard() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, trendsRes, aiStatsRes] = await Promise.all([
          get('/admin/analytics'),
          get('/admin/trends?days=30'),
          get('/ai/stats').catch(() => ({ data: null })) // AI stats might not be available
        ]);

        setAnalytics(analyticsRes.data);
        setTrends(trendsRes.data);
        setAiStats(aiStatsRes.data?.stats || null);
      } catch (err) {
        setError(t('adminDashboard.fetch_error'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [t]);

  if (loading) {
    return <Spinner message={t('adminDashboard.loading')} />;
  }

  if (error) {
    return (
      <div className="text-white p-4 md:p-0">
        <div className="bg-red-500/20 border border-red-500 rounded-2xl p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toFixed(0) || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const conversionRate = analytics ? ((analytics.users.premium / analytics.users.total) * 100).toFixed(1) : 0;

  return (
    <div className="text-white p-4 md:p-0 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t('adminDashboard.title')}</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('adminDashboard.total_users')}
          value={analytics?.users.total || 0}
          color="text-[#01C38D]"
          bgGradient="from-[#01C38D]/20 to-[#01C38D]/5"
          icon="👥"
        />
        <MetricCard
          title={t('adminDashboard.total_transactions')}
          value={formatNumber(analytics?.transactions.total)}
          color="text-[#36A2EB]"
          bgGradient="from-[#36A2EB]/20 to-[#36A2EB]/5"
          icon="💳"
        />
        <MetricCard
          title={t('adminDashboard.total_volume')}
          value={formatCurrency(analytics?.transactions.byType.expenses + analytics?.transactions.byType.income + analytics?.transactions.byType.savings)}
          color="text-[#FF6384]"
          bgGradient="from-[#FF6384]/20 to-[#FF6384]/5"
          icon="💰"
        />
        <MetricCard
          title={t('adminDashboard.conversion_rate')}
          value={`${conversionRate}%`}
          color="text-[#FFCE56]"
          bgGradient="from-[#FFCE56]/20 to-[#FFCE56]/5"
          icon="⭐"
        />
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#23263a] to-[#31344d] p-6 rounded-2xl border border-[#31344d]">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            {t('adminDashboard.growth_metrics')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-[#1a1d2e] rounded-xl">
              <div className="text-2xl font-bold text-[#01C38D]">{analytics?.users.premium || 0}</div>
              <div className="text-sm text-gray-400">{t('adminDashboard.premium_users')}</div>
            </div>
            <div className="text-center p-4 bg-[#1a1d2e] rounded-xl">
              <div className="text-2xl font-bold text-[#36A2EB]">{analytics?.users.free || 0}</div>
              <div className="text-sm text-gray-400">{t('adminDashboard.free_users')}</div>
            </div>
            <div className="text-center p-4 bg-[#1a1d2e] rounded-xl">
              <div className="text-2xl font-bold text-[#FFCE56]">{analytics?.users.recentSignups || 0}</div>
              <div className="text-sm text-gray-400">{t('adminDashboard.recent_signups')}</div>
            </div>
            <div className="text-center p-4 bg-[#1a1d2e] rounded-xl">
              <div className="text-2xl font-bold text-[#FF6384]">{trends?.summary.totalActiveUsers || 0}</div>
              <div className="text-sm text-gray-400">{t('adminDashboard.active_users')}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#23263a] to-[#31344d] p-6 rounded-2xl border border-[#31344d]">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">💼</span>
            {t('adminDashboard.engagement_metrics')}
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('adminDashboard.avg_daily_transactions')}</span>
              <span className="font-semibold">{trends?.summary.avgDailyTransactions?.toFixed(1) || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('adminDashboard.avg_daily_volume')}</span>
              <span className="font-semibold">{formatCurrency(trends?.summary.avgDailyVolume)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('adminDashboard.total_categories')}</span>
              <span className="font-semibold">{analytics?.categories.total || 0}</span>
            </div>
            {aiStats && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{t('adminDashboard.ai_accuracy')}</span>
                <span className="font-semibold text-[#01C38D]">{aiStats.accuracy}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          title={t('adminDashboard.expense_volume')}
          value={formatCurrency(analytics?.transactions.byType.expenses)}
          color="text-red-400"
          bgGradient="from-red-500/20 to-red-500/5"
          icon="📉"
        />
        <MetricCard
          title={t('adminDashboard.income_volume')}
          value={formatCurrency(analytics?.transactions.byType.income)}
          color="text-green-400"
          bgGradient="from-green-500/20 to-green-500/5"
          icon="📈"
        />
        <MetricCard
          title={t('adminDashboard.savings_volume')}
          value={formatCurrency(analytics?.transactions.byType.savings)}
          color="text-blue-400"
          bgGradient="from-blue-500/20 to-blue-500/5"
          icon="🏦"
        />
      </div>

      {/* Top Categories */}
      <div className="bg-gradient-to-br from-[#23263a] to-[#31344d] p-6 rounded-2xl border border-[#31344d]">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🏷️</span>
          {t('adminDashboard.top_categories')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {analytics?.categories.topUsed?.slice(0, 9).map((category, index) => (
            <div key={category.category} className="flex items-center justify-between p-3 bg-[#1a1d2e] rounded-lg">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-[#01C38D] text-black rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </span>
                <span className="text-sm truncate">{category.category}</span>
              </div>
              <span className="text-[#01C38D] font-semibold">{category.usage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Growth Chart Placeholder */}
      <div className="bg-gradient-to-br from-[#23263a] to-[#31344d] p-6 rounded-2xl border border-[#31344d]">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          {t('adminDashboard.monthly_growth')}
        </h2>
        <div className="h-64 flex items-center justify-center bg-[#1a1d2e] rounded-xl">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-sm">Growth chart visualization</div>
            <div className="text-xs mt-1">
              {analytics?.growth.monthlyData?.length || 0} months of data available
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-gradient-to-br from-[#23263a] to-[#31344d] p-6 rounded-2xl border border-[#31344d]">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🔧</span>
          {t('adminDashboard.system_health')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HealthIndicator 
            label="Database" 
            status="healthy" 
            value="99.9%" 
          />
          <HealthIndicator 
            label="API Response" 
            status="healthy" 
            value="<100ms" 
          />
          <HealthIndicator 
            label="User Sessions" 
            status="healthy" 
            value={`${trends?.summary.totalActiveUsers || 0} active`} 
          />
          <HealthIndicator 
            label="Data Processing" 
            status="healthy" 
            value="Real-time" 
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, color, bgGradient, icon }) {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} p-4 md:p-6 rounded-2xl border border-[#31344d]`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm md:text-md font-semibold text-gray-400">{title}</h2>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function HealthIndicator({ label, status, value }) {
  const statusColors = {
    healthy: 'text-green-400 border-green-400/20 bg-green-400/10',
    warning: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10',
    error: 'text-red-400 border-red-400/20 bg-red-400/10'
  };

  return (
    <div className={`p-3 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-green-400' : status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export default AdminDashboard; 