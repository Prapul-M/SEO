import React, { useState } from 'react';
import SeoScoreDashboard from '../components/SeoScoreDashboard';

// Mock data for the dashboard
const mockSeoScores = [
  {
    url: 'https://example.com',
    path: '/index.html',
    score: 92,
    previousScore: 85,
    lastUpdated: '2023-05-15T10:30:00Z',
    keywords: ['seo', 'automation', 'ai', 'nextjs'],
    pendingChanges: false
  },
  {
    url: 'https://example.com/blog',
    path: '/blog/index.html',
    score: 78,
    previousScore: 80,
    lastUpdated: '2023-05-14T09:15:00Z',
    keywords: ['blog', 'content', 'marketing', 'seo tips'],
    pendingChanges: true
  },
  {
    url: 'https://example.com/products',
    path: '/products/index.html',
    score: 65,
    previousScore: 60,
    lastUpdated: '2023-05-13T14:45:00Z',
    keywords: ['products', 'services', 'features'],
    pendingChanges: true
  },
  {
    url: 'https://example.com/about',
    path: '/about/index.html',
    score: 88,
    previousScore: 88,
    lastUpdated: '2023-05-12T11:20:00Z',
    keywords: ['about us', 'company', 'team'],
    pendingChanges: false
  },
  {
    url: 'https://example.com/contact',
    path: '/contact/index.html',
    score: 95,
    previousScore: 90,
    lastUpdated: '2023-05-11T16:05:00Z',
    keywords: ['contact', 'support', 'help'],
    pendingChanges: false
  }
];

export default function SeoDashboardDemo() {
  const [seoScores, setSeoScores] = useState(mockSeoScores);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [changesModal, setChangesModal] = useState(false);
  
  const handleViewDetails = (url: string) => {
    setSelectedUrl(url);
    setDetailsModal(true);
  };
  
  const handleViewPendingChanges = (url: string) => {
    setSelectedUrl(url);
    setChangesModal(true);
  };
  
  const handleCloseModal = () => {
    setDetailsModal(false);
    setChangesModal(false);
    setSelectedUrl(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">SEO Automation Dashboard Demo</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <SeoScoreDashboard 
            scores={seoScores}
            onViewDetails={handleViewDetails}
            onViewPendingChanges={handleViewPendingChanges}
          />
        </div>
        
        {/* Simple modal for demonstration purposes */}
        {(detailsModal || changesModal) && selectedUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {detailsModal ? 'SEO Details' : 'Pending Changes'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="font-medium">{selectedUrl}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {detailsModal 
                    ? 'Detailed SEO analysis and recommendations' 
                    : 'Review and approve suggested SEO changes'}
                </p>
              </div>
              
              {detailsModal ? (
                <div className="border rounded p-4 bg-gray-50">
                  <p className="text-sm text-gray-700">
                    This would show detailed SEO metrics, keyword analysis, and specific recommendations
                    for improving the SEO score of this page.
                  </p>
                </div>
              ) : (
                <div className="border rounded p-4 bg-gray-50">
                  <p className="font-medium mb-2">Suggested Changes:</p>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-2 mt-0.5">Title</span>
                      Update page title to include primary keywords
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-2 mt-0.5">Meta</span>
                      Improve meta description with call-to-action
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded mr-2 mt-0.5">H1</span>
                      Make heading more descriptive and keyword-rich
                    </li>
                  </ul>
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                
                {changesModal && (
                  <button 
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Apply Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 