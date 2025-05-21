import { useSession, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Plus, 
  Github, 
  Globe, 
  LineChart, 
  Settings,
  Search,
  ArrowUpRight,
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import SeoScoreDashboard from '../components/SeoScoreDashboard';
import Image from "next/image";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("projects");
  const [seoScores, setSeoScores] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [changesModal, setChangesModal] = useState(false);
  
  const projects = [
    {
      id: 1,
      name: "Company Website",
      url: "https://example.com",
      lastScan: "2023-11-10T12:00:00Z",
      seoScore: 85,
      githubRepo: "yourusername/company-website",
      suggestions: 12,
    },
    {
      id: 2,
      name: "E-commerce Shop",
      url: "https://shop.example.com",
      lastScan: "2023-11-09T15:30:00Z",
      seoScore: 73,
      githubRepo: "yourusername/shop",
      suggestions: 24,
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Please sign in to access the dashboard</p>
        <Link href="/api/auth/signin">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-8 py-2 pr-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </button>
          </div>
        </div>
        
        <div className="mb-6 border-b border-border">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-3 px-1 ${
                activeTab === "projects"
                  ? "border-b-2 border-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 px-1 ${
                activeTab === "analytics"
                  ? "border-b-2 border-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 px-1 ${
                activeTab === "settings"
                  ? "border-b-2 border-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Settings
            </button>
          </div>
        </div>
        
        {activeTab === "projects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg border border-border overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <div className={`text-lg font-bold ${getScoreColor(project.seoScore)}`}>
                      {project.seoScore}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground mb-2">
                    <Globe className="h-4 w-4 mr-2" />
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-foreground hover:underline transition-colors truncate"
                    >
                      {project.url}
                    </a>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground mb-4">
                    <Github className="h-4 w-4 mr-2" />
                    <span className="truncate">{project.githubRepo}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-6">
                    <span className="text-muted-foreground">Last scan: {formatDate(project.lastScan)}</span>
                    <span className="text-primary">{project.suggestions} suggestions</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 inline-flex justify-center items-center px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm transition-colors">
                      <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
                    </button>
                    <button className="flex-1 inline-flex justify-center items-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm transition-colors">
                      <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> View Report
                    </button>
                  </div>
                </div>
                
                <div className="bg-muted px-5 py-3 flex justify-between items-center">
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Run Scan
                  </button>
                  <button className="text-sm text-primary hover:text-primary/90 transition-colors">
                    View All Suggestions
                  </button>
                </div>
              </motion.div>
            ))}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 rounded-lg border border-dashed border-border p-6 flex flex-col items-center justify-center text-center h-[350px]"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Add a new project</h3>
              <p className="text-muted-foreground mb-6">
                Connect a GitHub repository or add your website URL to start improving your SEO
              </p>
              <button className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="mr-2 h-4 w-4" /> New Project
              </button>
            </motion.div>
          </div>
        )}
        
        {activeTab === "analytics" && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center mb-4">
              <LineChart className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-semibold">SEO Analytics</h2>
            </div>
            <p className="text-muted-foreground">
              Analytics dashboard coming soon. Track your SEO improvements, rankings, and more.
            </p>
          </div>
        )}
        
        {activeTab === "settings" && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-semibold">Account Settings</h2>
            </div>
            <p className="text-muted-foreground">
              Manage your account settings, notification preferences, and API keys.
            </p>
          </div>
        )}
      </main>
      
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
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
}; 