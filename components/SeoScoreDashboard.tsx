import React from 'react';
import { ArrowUp, ArrowDown, ChevronRight, BarChart3 } from 'lucide-react';

// Define types for our SEO score data
interface SeoScore {
  url: string;
  path: string;
  score: number;
  previousScore: number;
  lastUpdated: string;
  keywords: string[];
  pendingChanges: boolean;
}

interface SeoScoreDashboardProps {
  scores: SeoScore[];
  onViewDetails: (url: string) => void;
  onViewPendingChanges: (url: string) => void;
}

export default function SeoScoreDashboard({ 
  scores, 
  onViewDetails, 
  onViewPendingChanges 
}: SeoScoreDashboardProps) {
  
  // Function to determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Function to determine score change indicator
  const ScoreChange = ({ current, previous }: { current: number; previous: number }) => {
    const difference = current - previous;
    if (difference > 0) {
      return (
        <span className="flex items-center text-green-600 text-xs">
          <ArrowUp size={12} />
          {difference.toFixed(1)}
        </span>
      );
    } else if (difference < 0) {
      return (
        <span className="flex items-center text-red-500 text-xs">
          <ArrowDown size={12} />
          {Math.abs(difference).toFixed(1)}
        </span>
      );
    }
    return <span className="text-gray-400 text-xs">No change</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 size={20} />
          SEO Performance Dashboard
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Track and improve your website's SEO performance across all pages
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SEO Score
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keywords
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scores.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No SEO data available. Connect a repository to start analyzing SEO performance.
                </td>
              </tr>
            ) : (
              scores.map((item) => (
                <tr key={item.url} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {item.url}
                      </span>
                      <span className="text-xs text-gray-500 truncate max-w-xs">
                        {item.path}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-lg font-semibold ${getScoreColor(item.score)}`}>
                      {item.score}/100
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ScoreChange current={item.score} previous={item.previousScore} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {item.keywords.slice(0, 3).map((keyword) => (
                        <span 
                          key={keyword} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {keyword}
                        </span>
                      ))}
                      {item.keywords.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{item.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onViewDetails(item.url)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      >
                        Details
                        <ChevronRight size={16} />
                      </button>
                      {item.pendingChanges && (
                        <button
                          onClick={() => onViewPendingChanges(item.url)}
                          className="text-orange-600 hover:text-orange-900 flex items-center"
                        >
                          Changes
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
        Data is refreshed daily. Last scan: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
} 