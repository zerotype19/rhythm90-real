import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../lib/api';

interface BenchmarkMetric {
  id: string;
  team_id: string;
  metric_name: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  updated_at: string;
}

interface IndustryMetric {
  metric_name: string;
  average_value: number;
  min_value: number;
  max_value: number;
  team_count: number;
}

interface TeamBenchmarks {
  team_metrics: BenchmarkMetric[];
  industry_metrics: IndustryMetric[];
}

const metricLabels: Record<string, string> = {
  plays_created: 'Plays Created',
  signals_logged: 'Signals Logged',
  rituals_completed: 'Rituals Completed',
  shared_responses: 'Shared Responses',
  team_engagement: 'Team Engagement'
};

const metricDescriptions: Record<string, string> = {
  plays_created: 'Total strategic plays created by your team',
  signals_logged: 'Market signals and observations captured',
  rituals_completed: 'Quarterly rituals and planning sessions',
  shared_responses: 'Responses shared with team or publicly',
  team_engagement: 'Unique team members actively contributing'
};

function TeamBenchmarking() {
  const [benchmarks, setBenchmarks] = useState<TeamBenchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [showIndustry, setShowIndustry] = useState(true);

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' }
  ];

  const loadBenchmarks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getTeamBenchmarks(period);
      if (response.data) {
        setBenchmarks(response.data);
      } else {
        setError(response.error || 'Failed to load benchmarks');
      }
    } catch (err) {
      console.error('Failed to load benchmarks:', err);
      setError('Failed to load benchmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenchmarks();
  }, [period]);

  const getMetricValue = (metricName: string): number => {
    const metric = benchmarks?.team_metrics.find(m => m.metric_name === metricName);
    return metric?.metric_value || 0;
  };

  const getIndustryAverage = (metricName: string): number => {
    const metric = benchmarks?.industry_metrics.find(m => m.metric_name === metricName);
    return metric?.average_value || 0;
  };

  const getMaxValue = (metricName: string): number => {
    const metric = benchmarks?.industry_metrics.find(m => m.metric_name === metricName);
    return metric?.max_value || 0;
  };

  const getPerformanceBadge = (metricName: string): { text: string; color: string } => {
    const teamValue = getMetricValue(metricName);
    const industryAvg = getIndustryAverage(metricName);
    const maxValue = getMaxValue(metricName);

    if (teamValue >= maxValue * 0.8) {
      return { text: 'Top 20%', color: 'bg-green-100 text-green-800' };
    } else if (teamValue >= industryAvg) {
      return { text: 'Above Average', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: 'Below Average', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const formatMetricValue = (value: number, metricName: string): string => {
    if (metricName === 'team_engagement') {
      return `${value} active members`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Team Benchmarking</h1>
          <p className="mt-2 text-gray-600">Compare your team's performance against industry standards.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Time Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                {periods.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showIndustry}
                  onChange={(e) => setShowIndustry(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show Industry Comparison</span>
              </label>
            </div>
          </div>
        </div>

        {benchmarks && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team Metrics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Your Team Metrics</h2>
                <p className="mt-1 text-sm text-gray-600">Performance over the selected period</p>
              </div>
              <div className="p-6 space-y-6">
                {Object.keys(metricLabels).map((metricName) => {
                  const value = getMetricValue(metricName);
                  const badge = getPerformanceBadge(metricName);
                  
                  return (
                    <div key={metricName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {metricLabels[metricName]}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {metricDescriptions[metricName]}
                      </p>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatMetricValue(value, metricName)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Industry Comparison */}
            {showIndustry && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Industry Comparison</h2>
                  <p className="mt-1 text-sm text-gray-600">How you compare to other teams</p>
                </div>
                <div className="p-6 space-y-6">
                  {Object.keys(metricLabels).map((metricName) => {
                    const teamValue = getMetricValue(metricName);
                    const industryAvg = getIndustryAverage(metricName);
                    const percentile75 = getPercentile(metricName);
                    
                    return (
                      <div key={metricName} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          {metricLabels[metricName]}
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Your Team:</span>
                            <span className="font-medium text-gray-900">
                              {formatMetricValue(teamValue, metricName)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Industry Average:</span>
                            <span className="font-medium text-gray-900">
                              {formatMetricValue(industryAvg, metricName)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Top 25% Threshold:</span>
                            <span className="font-medium text-gray-900">
                              {formatMetricValue(percentile75, metricName)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Simple progress bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>0</span>
                            <span>{formatMetricValue(industryAvg, metricName)}</span>
                            <span>{formatMetricValue(percentile75, metricName)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min((teamValue / Math.max(percentile75, 1)) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insights Section */}
        {benchmarks && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Performance Insights</h2>
              <p className="mt-1 text-sm text-gray-600">Key takeaways from your benchmarking data</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(metricLabels).map((metricName) => {
                  const badge = getPerformanceBadge(metricName);
                  const teamValue = getMetricValue(metricName);
                  const industryAvg = getIndustryAverage(metricName);
                  
                  return (
                    <div key={metricName} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{metricLabels[metricName]}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {teamValue > industryAvg 
                          ? `You're performing ${Math.round((teamValue / industryAvg - 1) * 100)}% above the industry average.`
                          : `You're performing ${Math.round((1 - teamValue / industryAvg) * 100)}% below the industry average.`
                        }
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default TeamBenchmarking; 