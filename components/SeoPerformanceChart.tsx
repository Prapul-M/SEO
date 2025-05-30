import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SeoPerformanceMetrics } from '@/types/database';

interface SeoPerformanceChartProps {
  metrics: SeoPerformanceMetrics[];
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void;
}

export default function SeoPerformanceChart({
  metrics,
  timeRange,
  onTimeRangeChange,
}: SeoPerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'clicks' | 'impressions' | 'position'>('clicks');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'clicks':
        return '#3B82F6';
      case 'impressions':
        return '#10B981';
      case 'position':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatMetricValue = (value: number, metric: string) => {
    if (metric === 'position') {
      return value.toFixed(1);
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">SEO Performance</h3>
        <div className="flex items-center space-x-2">
          {/* Metric Selector */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'clicks' | 'impressions' | 'position')}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="clicks">Clicks</option>
            <option value="impressions">Impressions</option>
            <option value="position">Avg. Position</option>
          </select>

          {/* Time Range Selector */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => onTimeRangeChange('7d')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                timeRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:text-gray-500 border border-gray-300'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => onTimeRangeChange('30d')}
              className={`px-4 py-2 text-sm font-medium -ml-px ${
                timeRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:text-gray-500 border border-gray-300'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => onTimeRangeChange('90d')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md -ml-px ${
                timeRange === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:text-gray-500 border border-gray-300'
              }`}
            >
              90D
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metrics}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                minTickGap={30}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={(value: number) => formatMetricValue(value, selectedMetric)}
              />
              {selectedMetric === 'position' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  reversed={true}
                  domain={[1, 'auto']}
                />
              )}
              <Tooltip
                formatter={(value: number) => formatMetricValue(value, selectedMetric)}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line
                yAxisId={selectedMetric === 'position' ? 'right' : 'left'}
                type="monotone"
                dataKey={selectedMetric}
                stroke={getMetricColor(selectedMetric)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Total Clicks</div>
            <div className="mt-1 text-2xl font-semibold text-blue-900">
              {metrics.reduce((sum, m) => sum + m.clicks, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-600">Total Impressions</div>
            <div className="mt-1 text-2xl font-semibold text-green-900">
              {metrics.reduce((sum, m) => sum + m.impressions, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm font-medium text-yellow-600">Avg. Position</div>
            <div className="mt-1 text-2xl font-semibold text-yellow-900">
              {(metrics.reduce((sum, m) => sum + m.average_position, 0) / metrics.length).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 