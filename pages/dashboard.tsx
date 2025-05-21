import { useSession, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
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
  AlertCircle,
  Check,
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import SeoScoreDashboard from '../components/SeoScoreDashboard';
import Image from "next/image";
import { getUserRepositories, GithubRepo, getHtmlFiles, getFileContent, createBranch, updateFile, createPullRequest } from "@/lib/github";
import { sendSeoReport } from "@/lib/email";
import { analyzeSeoWithAI } from "@/lib/openai";

// Define our project interface
interface Project {
  id: string;
  name: string;
  url: string;
  lastScan?: string;
  seoScore?: number;
  githubRepo: string;
  suggestions?: number;
  owner: string;
  repo: string;
  defaultBranch: string;
  selected?: boolean;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [changesModal, setChangesModal] = useState(false);
  const [scanningRepo, setScanningRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<any>(null);
  const [emailSent, setEmailSent] = useState(false);
  
  // Fetch repositories when session is available
  useEffect(() => {
    if (session && session.user) {
      fetchUserRepositories();
    }
  }, [session]);

  // Filter projects based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        project.githubRepo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

  const fetchUserRepositories = async () => {
    setLoading(true);
    setError(null);
    try {
      const repos = await getUserRepositories(session as any);
      const projectsList = repos.map((repo) => ({
        id: `${repo.owner}/${repo.repo}`,
        name: repo.repo,
        url: `https://github.com/${repo.owner}/${repo.repo}`,
        githubRepo: `${repo.owner}/${repo.repo}`,
        owner: repo.owner,
        repo: repo.repo,
        defaultBranch: repo.defaultBranch,
        selected: false
      }));
      setProjects(projectsList);
      setFilteredProjects(projectsList);
    } catch (err) {
      console.error("Failed to fetch repositories:", err);
      setError("Failed to fetch your GitHub repositories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async (project: Project) => {
    setScanningRepo(project.githubRepo);
    setEmailSent(false);
    
    try {
      // Get HTML files from the repository
      const htmlFiles = await getHtmlFiles(
        session as any,
        project.owner,
        project.repo,
        "",
        project.defaultBranch
      );
      
      // Create an empty array to store detailed analysis for each file
      const detailedAnalysis = [];
      
      // Analyze each HTML file using OpenAI
      for (const filePath of htmlFiles) {
        try {
          // Get the content of each HTML file
          const fileContent = await getFileContent(
            session as any,
            project.owner,
            project.repo,
            filePath,
            project.defaultBranch
          );
          
          // Analyze the file content using OpenAI
          const analysis = await analyzeSeoWithAI(fileContent.content, filePath);
          
          // Add file path to the analysis result
          const pageAnalysis = {
            filePath,
            ...analysis
          };
          
          detailedAnalysis.push(pageAnalysis);
        } catch (err) {
          console.error(`Error analyzing file ${filePath}:`, err);
        }
      }
      
      // Calculate overall SEO score based on all pages
      const overallScore = detailedAnalysis.length > 0
        ? Math.floor(detailedAnalysis.reduce((sum, page) => sum + page.score, 0) / detailedAnalysis.length)
        : 70; // Default score if no pages were analyzed
      
      // Count total number of issues
      const totalIssues = detailedAnalysis.reduce((sum, page) => 
        sum + page.sections.reduce((sectionSum, section) => sectionSum + section.issues.length, 0), 0);
      
      // Update the project with scan data
      const updatedProjects = projects.map(p => {
        if (p.id === project.id) {
          return {
            ...p,
            lastScan: new Date().toISOString(),
            seoScore: overallScore,
            suggestions: totalIssues,
          };
        }
        return p;
      });
      
      // Store scan results for display in the modal
      setScanResults({
        projectId: project.id,
        overallScore,
        totalIssues,
        detailedAnalysis
      });
      
      setProjects(updatedProjects);
      // Update filtered projects as well to maintain UI consistency
      if (searchTerm.trim() === "") {
        setFilteredProjects(updatedProjects);
      } else {
        const filtered = updatedProjects.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.githubRepo.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProjects(filtered);
      }
      
      // Show details modal
      setSelectedUrl(project.url);
      setDetailsModal(true);
      
      // Send email report if user has an email
      if (session?.user?.email) {
        // Prepare the report data
        const reportData = {
          projectName: project.name,
          url: project.url,
          overallScore,
          totalIssues,
          pagesAnalyzed: detailedAnalysis.length,
          detailedAnalysis
        };
        
        // Send the report
        const emailSent = await sendSeoReport(session.user.email, reportData);
        setEmailSent(emailSent);
      }
      
    } catch (err) {
      console.error(`Failed to scan repository ${project.githubRepo}:`, err);
      setError(`Failed to scan repository ${project.githubRepo}. Please try again later.`);
    } finally {
      setScanningRepo(null);
    }
  };

  const toggleRepositorySelection = (projectId: string) => {
    // If this project is already selected, unselect it
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      
      // Update all projects to be unselected
      const updatedProjects = projects.map(project => ({
        ...project,
        selected: false
      }));
      
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects.filter(p => 
        searchTerm.trim() === "" || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.githubRepo.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      return;
    }
    
    // Otherwise, select only this project and deselect all others
    setSelectedProjectId(projectId);
    
    const updatedProjects = projects.map(project => ({
      ...project,
      selected: project.id === projectId
    }));
    
    setProjects(updatedProjects);
    setFilteredProjects(updatedProjects.filter(p => 
      searchTerm.trim() === "" || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.githubRepo.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  };

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

  const handleApplyChanges = async () => {
    if (!selectedUrl || !scanResults) return;
    
    // Find the project
    const project = projects.find(p => p.url === selectedUrl);
    if (!project) return;
    
    try {
      const appliedChanges = [];
      
      // For each file in the detailed analysis
      for (const page of scanResults.detailedAnalysis) {
        try {
          // Get the current file content
          const originalContent = await getFileContent(
            session as any,
            project.owner,
            project.repo,
            page.filePath,
            project.defaultBranch
          );
          
          // Create a new branch for the changes
          const branchName = `seo-improvements-${new Date().getTime()}`;
          await createBranch(
            session as any,
            project.owner,
            project.repo,
            project.defaultBranch,
            branchName
          );
          
          // Apply the SEO improvements
          // The updateFile function already includes the applySeoImprovements logic
          const updateResult = await updateFile(
            session as any,
            project.owner,
            project.repo,
            page.filePath,
            originalContent.content,
            originalContent.sha,
            branchName,
            `SEO improvements for ${page.filePath}`
          );
          
          if (updateResult) {
            appliedChanges.push({
              file: page.filePath,
              branch: branchName
            });
            
            // Create a pull request with the changes
            const prUrl = await createPullRequest(
              session as any,
              project.owner,
              project.repo,
              branchName,
              project.defaultBranch,
              `SEO Improvements for ${page.filePath}`,
              `This PR includes automated SEO improvements for better search engine visibility.
              
## Changes applied based on analysis:
${page.sections.flatMap((section: { name: string; issues: Array<{ type: string; suggestion: string }> }) => 
  section.issues.map((issue: { type: string; suggestion: string }) => 
    `- **${issue.type}**: ${issue.suggestion}`
  )
).join('\n')}

These changes should help improve your site's SEO score and search engine rankings.`
            );
          }
        } catch (err) {
          console.error(`Error applying changes to ${page.filePath}:`, err);
        }
      }
      
      // Show success message
      if (appliedChanges.length > 0) {
        setError(null);
        alert(`Changes applied successfully to ${appliedChanges.length} files! Pull requests have been created with your SEO improvements.`);
      } else {
        setError("Failed to apply any changes. Please try again later.");
      }
      
      // Close the modal
      handleCloseModal();
      
    } catch (err) {
      console.error("Failed to apply SEO changes:", err);
      setError("Failed to apply SEO changes. Please try again later.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-3 text-lg">Loading your projects...</p>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 py-2 pr-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button 
              onClick={fetchUserRepositories}
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" /> Refresh Projects
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              Dismiss
            </button>
          </div>
        )}
        
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
          <>
            {filteredProjects.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 
                    "No projects match your search. Try a different search term." : 
                    "No GitHub repositories found. Refresh to fetch your repositories."}
                </p>
                <button 
                  onClick={fetchUserRepositories}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Github className="mr-2 h-4 w-4" /> Refresh Repositories
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-lg border border-border overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleRepositorySelection(project.id)}
                            className={`w-5 h-5 rounded border flex-shrink-0 mr-3 flex items-center justify-center ${
                              project.selected 
                                ? "bg-primary border-primary" 
                                : "bg-background border-input"
                            }`}
                          >
                            {project.selected && <Check className="h-3 w-3 text-white" />}
                          </button>
                          <h3 className="text-xl font-semibold">{project.name}</h3>
                        </div>
                        {project.seoScore !== undefined && (
                          <div className={`text-lg font-bold ${getScoreColor(project.seoScore)}`}>
                            {project.seoScore}
                          </div>
                        )}
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
                        <span className="text-muted-foreground">
                          {project.lastScan 
                            ? `Last scan: ${formatDate(project.lastScan)}` 
                            : "Not scanned yet"}
                        </span>
                        {project.suggestions !== undefined && (
                          <span className="text-primary">{project.suggestions} suggestions</span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="flex-1 inline-flex justify-center items-center px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm transition-colors">
                          <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
                        </button>
                        {project.seoScore !== undefined ? (
                          <button 
                            onClick={() => handleViewDetails(project.url)}
                            className="flex-1 inline-flex justify-center items-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm transition-colors"
                          >
                            <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> View Report
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRunScan(project)}
                            className="flex-1 inline-flex justify-center items-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm transition-colors"
                            disabled={scanningRepo === project.githubRepo}
                          >
                            {scanningRepo === project.githubRepo ? (
                              <>
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5"></div> Scanning
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> Scan Now
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted px-5 py-3 flex justify-between items-center">
                      <button 
                        onClick={() => handleRunScan(project)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        disabled={scanningRepo === project.githubRepo}
                      >
                        {scanningRepo === project.githubRepo ? "Scanning..." : "Run Scan"}
                      </button>
                      {project.suggestions !== undefined && project.suggestions > 0 && (
                        <button 
                          onClick={() => handleViewPendingChanges(project.url)}
                          className="text-sm text-primary hover:text-primary/90 transition-colors"
                        >
                          View All Suggestions
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            
            {emailSent && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <p>SEO analysis report has been sent to your email.</p>
              </div>
            )}
            
            {detailsModal && scanResults ? (
              <div className="space-y-6">
                <div className="border rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Overall SEO Score</h3>
                    <div className={`text-lg font-bold ${getScoreColor(scanResults.overallScore)}`}>
                      {scanResults.overallScore}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded p-3 shadow-sm">
                      <p className="text-sm text-gray-500">Pages Analyzed</p>
                      <p className="text-xl font-medium">{scanResults.detailedAnalysis.length}</p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                      <p className="text-sm text-gray-500">Total Issues</p>
                      <p className="text-xl font-medium">{scanResults.totalIssues}</p>
                    </div>
                    <div className="bg-white rounded p-3 shadow-sm">
                      <p className="text-sm text-gray-500">Estimated Improvement</p>
                      <p className="text-xl font-medium">+{Math.floor(Math.random() * 15) + 5}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-2">
                    <h3 className="font-medium mb-2">HTML Files Analyzed:</h3>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                        {scanResults.detailedAnalysis.map((page: any, idx: number) => (
                          <li key={idx}>{page.filePath}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Page-by-Page Analysis</h3>
                  
                  {scanResults.detailedAnalysis.map((page: any, pageIdx: number) => (
                    <div key={pageIdx} className="border rounded overflow-hidden">
                      <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">{page.filePath}</h4>
                        <div className={`text-sm font-bold ${getScoreColor(page.score)}`}>
                          Score: {page.score}
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h5 className="font-medium mb-2">Suggested Keywords:</h5>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {page.keywords.suggested.map((keyword: string, kIdx: number) => (
                            <span 
                              key={kIdx} 
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                        
                        {page.sections.map((section: any, sIdx: number) => (
                          <div key={sIdx} className="mb-4 last:mb-0">
                            <h5 className="font-medium text-sm text-gray-700 mb-2">{section.name}</h5>
                            
                            <div className="text-sm space-y-3">
                              {section.issues.map((issue: any, iIdx: number) => (
                                <div key={iIdx} className="pl-3 border-l-2 border-blue-400">
                                  <div className="flex items-start mb-1">
                                    <span 
                                      className={`
                                        text-xs px-2 py-0.5 rounded mr-2 
                                        ${issue.type === 'title' ? 'bg-green-100 text-green-800' : 
                                          issue.type === 'meta' ? 'bg-blue-100 text-blue-800' : 
                                          issue.type === 'h1' ? 'bg-purple-100 text-purple-800' : 
                                          'bg-gray-100 text-gray-800'}
                                      `}
                                    >
                                      {issue.type}
                                    </span>
                                    <span className="text-red-600 font-medium">
                                      {issue.issue}
                                    </span>
                                  </div>
                                  
                                  <div className="pl-2 mb-1">
                                    <code className="text-xs bg-gray-100 p-1 rounded block">
                                      {issue.element}
                                    </code>
                                  </div>
                                  
                                  <div className="pl-2 flex items-start">
                                    <ArrowRight className="h-3 w-3 mr-1 mt-0.5 text-green-600" />
                                    <span className="text-green-600">
                                      {issue.suggestion}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : changesModal ? (
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
            ) : (
              <div className="border rounded p-4 bg-gray-50">
                <p className="text-sm text-gray-700 mb-4">
                  Loading SEO analysis...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              
              {changesModal ? (
                <button 
                  onClick={handleApplyChanges}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Apply Changes
                </button>
              ) : detailsModal && scanResults && (
                <button 
                  onClick={() => {
                    setDetailsModal(false);
                    setChangesModal(true);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Review Improvements
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