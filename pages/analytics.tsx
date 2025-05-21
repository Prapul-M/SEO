import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Header from '@/components/Header';
import { LineChart, BarChart, PieChart, Calendar, ArrowRight, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// Demo data for the analytics page
const demoData = {
  overallScore: 72,
  scoreByPage: [
    { page: 'index.html', score: 85 },
    { page: 'about.html', score: 65 },
    { page: 'services.html', score: 72 },
    { page: 'contact.html', score: 68 },
    { page: 'blog/post-1.html', score: 82 },
  ],
  issueTypes: [
    { type: 'Missing meta descriptions', count: 8 },
    { type: 'Poor title tags', count: 5 },
    { type: 'Missing alt text', count: 12 },
    { type: 'Header structure issues', count: 3 },
    { type: 'Keyword density', count: 7 },
  ],
  scoreHistory: [
    { date: '2024-01', score: 52 },
    { date: '2024-02', score: 58 },
    { date: '2024-03', score: 63 },
    { date: '2024-04', score: 67 },
    { date: '2024-05', score: 72 },
  ]
};

export default function Analytics() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectedRepository, setSelectedRepository] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState(demoData);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('6m');

  useEffect(() => {
    if (status === 'authenticated') {
      const storedRepo = localStorage.getItem('selectedRepository');
      
      if (!storedRepo) {
        router.push('/auth/repository-selection');
      } else {
        try {
          const repoData = JSON.parse(storedRepo);
          setSelectedRepository(repoData);
          setTimeout(() => setLoading(false), 1000); // Simulate loading for demo
        } catch (err) {
          console.error('Error parsing stored repository data:', err);
          localStorage.removeItem('selectedRepository');
          router.push('/auth/repository-selection');
        }
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleChangeDateRange = (range: string) => {
    setDateRange(range);
    // In a real app, this would fetch new data based on the range
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Please sign in to access analytics</p>
        <Link href="/auth/signin">
          <button className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Sign in <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">SEO Analytics</h1>
            {selectedRepository && (
              <p className="text-muted-foreground">
                Repository: <span className="font-medium">{selectedRepository.owner}/{selectedRepository.repo}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="relative">
              <button className="inline-flex items-center px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                {dateRange === '1m' ? '1 Month' : 
                 dateRange === '3m' ? '3 Months' : 
                 dateRange === '6m' ? '6 Months' : '1 Year'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-card rounded-md shadow-lg border border-border overflow-hidden hidden">
                <button 
                  onClick={() => handleChangeDateRange('1m')}
                  className="block w-full text-left px-4 py-2 hover:bg-secondary/50 text-sm"
                >
                  1 Month
                </button>
                <button 
                  onClick={() => handleChangeDateRange('3m')}
                  className="block w-full text-left px-4 py-2 hover:bg-secondary/50 text-sm"
                >
                  3 Months
                </button>
                <button 
                  onClick={() => handleChangeDateRange('6m')}
                  className="block w-full text-left px-4 py-2 hover:bg-secondary/50 text-sm"
                >
                  6 Months
                </button>
                <button 
                  onClick={() => handleChangeDateRange('1y')}
                  className="block w-full text-left px-4 py-2 hover:bg-secondary/50 text-sm"
                >
                  1 Year
                </button>
              </div>
            </div>
            
            <button className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Export Report
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-medium">Overall SEO Score</h2>
                <p className="text-muted-foreground text-sm">Current repository</p>
              </div>
              <div className={`text-4xl font-bold ${
                analyticsData.overallScore >= 80 ? 'text-green-500' : 
                analyticsData.overallScore >= 60 ? 'text-yellow-500' : 
                'text-red-500'
              }`}>
                {analyticsData.overallScore}
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full">
              <div 
                className={`h-2 rounded-full ${
                  analyticsData.overallScore >= 80 ? 'bg-green-500' : 
                  analyticsData.overallScore >= 60 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${analyticsData.overallScore}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium mb-1">Found Issues</h2>
            <p className="text-muted-foreground text-sm mb-4">By category</p>
            <div className="space-y-2">
              {analyticsData.issueTypes.slice(0, 3).map((issue, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{issue.type}</span>
                  <span className="text-sm font-medium">{issue.count}</span>
                </div>
              ))}
              {analyticsData.issueTypes.length > 3 && (
                <button className="text-primary text-sm hover:underline">
                  View all ({analyticsData.issueTypes.length}) issues
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium mb-1">SEO Progress</h2>
            <p className="text-muted-foreground text-sm mb-4">Last 6 months</p>
            <div className="flex items-end h-24 justify-between">
              {analyticsData.scoreHistory.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-6 bg-primary rounded-t"
                    style={{ height: `${(item.score / 100) * 6}rem` }}
                  ></div>
                  <span className="text-xs mt-2">{item.date.split('-')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium mb-6">Page Performance</h2>
            <div className="space-y-4">
              {analyticsData.scoreByPage.map((page, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{page.page}</span>
                    <span 
                      className={`text-sm font-medium ${
                        page.score >= 80 ? 'text-green-500' : 
                        page.score >= 60 ? 'text-yellow-500' : 
                        'text-red-500'
                      }`}
                    >
                      {page.score}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        page.score >= 80 ? 'bg-green-500' : 
                        page.score >= 60 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${page.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-medium mb-6">Optimization Recommendations</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-green-100 text-green-600 p-2 rounded mr-4">
                  <LineChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium">Improve Meta Descriptions</h3>
                  <p className="text-muted-foreground text-sm">Add compelling meta descriptions to 8 pages</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-yellow-100 text-yellow-600 p-2 rounded mr-4">
                  <BarChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium">Optimize Title Tags</h3>
                  <p className="text-muted-foreground text-sm">Include keywords in titles for 5 pages</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 text-blue-600 p-2 rounded mr-4">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium">Add Alt Text to Images</h3>
                  <p className="text-muted-foreground text-sm">12 images missing descriptive alt text</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 text-purple-600 p-2 rounded mr-4">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium">Create Content Calendar</h3>
                  <p className="text-muted-foreground text-sm">Plan regular content updates to improve SEO</p>
                </div>
              </div>
              
              <button className="text-primary text-sm hover:underline mt-2">
                View detailed recommendations
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6 mb-8">
          <h2 className="text-lg font-medium mb-6">Note</h2>
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-primary mr-2 mt-0.5" />
            <p className="text-muted-foreground">
              This is a demo analytics page showcasing the UI. In a production environment, this would display real-time analytics 
              about your SEO performance based on scans of your repository content. The charts and data would reflect your actual 
              SEO improvements over time.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>SEO Optimization Platform &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
}; 