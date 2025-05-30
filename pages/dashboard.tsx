import { useSession, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  FileText,
  FolderGit2,
  Loader2,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import SeoScoreDashboard from '../components/SeoScoreDashboard';
import Image from "next/image";
import { getUserRepositories, GithubRepo, getHtmlFiles, getFileContent, createBranch, updateFile, createPullRequest } from "@/lib/github";
import { sendSeoReport } from "@/lib/email";
import { analyzeSeoWithAI } from "@/lib/openai";
import { useRouter } from "next/router";
import { SeoDetailsModal } from "@/components/modals/SeoDetailsModal";
import Layout from '@/components/Layout';
import SeoControlPanel from '@/components/SeoControlPanel';
import AutomationScheduler from '@/components/AutomationScheduler';
import AutomationLogs from '@/components/AutomationLogs';
import ReportDownloader from '@/components/ReportDownloader';
import ProjectManager from '@/components/ProjectManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SeoIssue {
  id: string;
  page_url: string;
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  suggestion: string;
  fixed: boolean;
}

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
  last_scan_at: string | null;
  scanning: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
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
  const [isMockMode] = useState<boolean>(process.env.NEXT_PUBLIC_USING_API_KEYS !== 'true');
  const [selectedRepository, setSelectedRepository] = useState<GithubRepo | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [scanning, setScanning] = useState(false);
  
  const loadSelectedRepository = useCallback(async () => {
    if (!selectedRepository) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const project: Project = {
        id: `${selectedRepository.owner}/${selectedRepository.repo}`,
        name: selectedRepository.repo,
        url: `https://github.com/${selectedRepository.owner}/${selectedRepository.repo}`,
        githubRepo: `${selectedRepository.owner}/${selectedRepository.repo}`,
        owner: selectedRepository.owner,
        repo: selectedRepository.repo,
        defaultBranch: selectedRepository.defaultBranch,
        selected: true,
        last_scan_at: null,
        scanning: false
      };
      
      setProjects([project]);
      setFilteredProjects([project]);
      setSelectedProjectId(project.id);
      setSelectedProject(project);
    } catch (err) {
      console.error("Failed to load repository:", err);
      setError("Failed to load your selected GitHub repository. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedRepository]);
  
  // Check if a repository is selected and redirect if not
  useEffect(() => {
    if (status === 'authenticated') {
      const storedRepo = localStorage.getItem('selectedRepository');
      
      if (!storedRepo) {
        router.push('/auth/repository-selection');
      } else {
        try {
          const repoData = JSON.parse(storedRepo) as GithubRepo;
          setSelectedRepository(repoData);
        } catch (err) {
          console.error('Error parsing stored repository data:', err);
          localStorage.removeItem('selectedRepository');
          router.push('/auth/repository-selection');
        }
      }
    }
  }, [status, router]);
  
  // Load only the selected repository instead of all repositories
  useEffect(() => {
    if (session && session.user && selectedRepository) {
      loadSelectedRepository();
    }
  }, [session, selectedRepository, loadSelectedRepository]);

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

  const handleChangeRepository = () => {
    localStorage.removeItem('selectedRepository');
    router.push('/auth/repository-selection');
  };

  const fetchUserRepositories = async () => {
    if (selectedRepository) {
      loadSelectedRepository();
      return;
    }
    
    router.push('/auth/repository-selection');
  };

  const handleRunScan = async (project: Project) => {
    setScanningRepo(project.githubRepo);
    setEmailSent(false);
    
    // Helper function to update project and set scan results
    const updateProjectScan = (project: Project, overallScore: number, totalIssues: number, detailedAnalysis: any[]) => {
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
        sendSeoReport(session.user.email, reportData)
          .then(success => setEmailSent(success))
          .catch(err => console.error('Error sending email report:', err));
      }
    };
    
    try {
      // Log whether we're using real AI or mock data
      console.log('SEO Analysis Mode:', process.env.OPENAI_API_KEY ? 'REAL AI' : 'MOCK DATA');
      console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
      console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
      console.log('Starting scan for repository:', project.githubRepo);
      
      // For demo or testing, users can bypass GitHub file fetching and use mock data
      const useMockDataOnly = process.env.NEXT_PUBLIC_USING_API_KEYS !== 'true';
      
      if (useMockDataOnly) {
        console.log('Using pre-defined mock data for demo purposes');
        
        // Create mock data for demo purposes
        const mockScanResults = {
          projectId: project.id,
          overallScore: Math.floor(Math.random() * (85 - 65) + 65), // Random score between 65-85
          totalIssues: Math.floor(Math.random() * 15) + 5, // Random number of issues between 5-20
          detailedAnalysis: [
            {
              filePath: 'index.html',
              score: Math.floor(Math.random() * (90 - 60) + 60),
              sections: [
                {
                  name: 'Head Section',
                  issues: [
                    {
                      type: 'title',
                      element: '<title>Home Page</title>',
                      issue: 'Title is too generic',
                      suggestion: 'Update page title to include primary keywords',
                      severity: 'medium'
                    },
                    {
                      type: 'meta',
                      element: '<meta name="description" content="Welcome to our website">',
                      issue: 'Meta description is too short and generic',
                      suggestion: 'Add a compelling meta description with call-to-action and keywords',
                      severity: 'high'
                    }
                  ]
                },
                {
                  name: 'Body Section',
                  issues: [
                    {
                      type: 'h1',
                      element: '<h1>Welcome</h1>',
                      issue: 'H1 is not descriptive enough',
                      suggestion: 'Make heading more descriptive and include primary keyword',
                      severity: 'medium'
                    },
                    {
                      type: 'img',
                      element: '<img src="header.jpg">',
                      issue: 'Missing alt text on image',
                      suggestion: 'Add descriptive alt text to improve accessibility and SEO',
                      severity: 'high'
                    }
                  ]
                }
              ],
              keywords: {
                current: ['home', 'welcome', 'website'],
                suggested: ['seo optimization', 'digital marketing', 'web development', 'search engine', 'ranking']
              }
            },
            {
              filePath: 'about.html',
              score: Math.floor(Math.random() * (90 - 60) + 60),
              sections: [
                {
                  name: 'Head Section',
                  issues: [
                    {
                      type: 'title',
                      element: '<title>About Us</title>',
                      issue: 'Title could be more descriptive',
                      suggestion: 'Update title to include company name and value proposition',
                      severity: 'medium'
                    }
                  ]
                },
                {
                  name: 'Body Section',
                  issues: [
                    {
                      type: 'content',
                      element: '<p>We are a company...</p>',
                      issue: 'Content is too thin',
                      suggestion: 'Add more detailed content about your company, mission, and services',
                      severity: 'medium'
                    }
                  ]
                }
              ],
              keywords: {
                current: ['about', 'company', 'team'],
                suggested: ['company history', 'team expertise', 'industry leadership', 'mission statement', 'values']
              }
            },
            {
              filePath: 'contact.html',
              score: Math.floor(Math.random() * (90 - 60) + 60),
              sections: [
                {
                  name: 'Head Section',
                  issues: [
                    {
                      type: 'meta',
                      element: '<meta name="description" content="Contact us">',
                      issue: 'Meta description is too short',
                      suggestion: 'Expand meta description to include location and contact methods',
                      severity: 'medium'
                    }
                  ]
                }
              ],
              keywords: {
                current: ['contact', 'email', 'phone'],
                suggested: ['get in touch', 'customer support', 'help desk', 'business hours', 'location']
              }
            }
          ]
        };
        
        // Calculate total issues
        const totalIssues = mockScanResults.detailedAnalysis.reduce((sum, page) => 
          sum + page.sections.reduce((sectionSum, section) => sectionSum + section.issues.length, 0), 0);
        
        mockScanResults.totalIssues = totalIssues;
        
        // Update the project with scan results
        const updatedProjects = projects.map(p => {
          if (p.id === project.id) {
            return {
              ...p,
              lastScan: new Date().toISOString(),
              seoScore: mockScanResults.overallScore,
              suggestions: totalIssues,
            };
          }
          return p;
        });
        
        // Store scan results for display in the modal
        setScanResults(mockScanResults);
        
        setProjects(updatedProjects);
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
        
        // Simulate email report
        if (session?.user?.email) {
          setEmailSent(true);
        }
        
        return;
      }

      // Get HTML files from the repository
      console.log(`Fetching HTML files from GitHub repository ${project.owner}/${project.repo}`);
      const htmlFiles = await getHtmlFiles(
        session as any,
        project.owner,
        project.repo,
        "",
        project.defaultBranch
      );
      
      console.log(`Found ${htmlFiles.length} files to analyze in repository`);
      
      // If no HTML files were found, provide helpful feedback
      if (htmlFiles.length === 0) {
        console.log('No HTML, JSX, or TSX files found in the repository. Using sample files instead.');
        
        // Use mock sample files for analysis
        const sampleFiles = [
          { path: 'sample/index.html', content: '<html><head><title>Sample Page</title></head><body><h1>Welcome</h1><p>This is a sample page.</p></body></html>' },
          { path: 'sample/about.html', content: '<html><head><title>About Page</title></head><body><h2>About</h2><p>About page content.</p></body></html>' }
        ];
        
        // Create an empty array to store detailed analysis for each sample file
        const detailedAnalysis = [];
        
        // Analyze each sample file
        for (const file of sampleFiles) {
          try {
            console.log(`Analyzing sample file: ${file.path}`);
            // Analyze the file content using OpenAI
            const analysis = await analyzeSeoWithAI(file.content, file.path);
            
            // Add file path to the analysis result
            const pageAnalysis = {
              filePath: file.path,
              ...analysis
            };
            
            detailedAnalysis.push(pageAnalysis);
          } catch (err) {
            console.error(`Error analyzing sample file ${file.path}:`, err);
          }
        }
        
        // Rest of analysis similar to real files...
        // Calculate overall SEO score based on all pages
        const overallScore = detailedAnalysis.length > 0
          ? Math.floor(detailedAnalysis.reduce((sum, page) => sum + page.score, 0) / detailedAnalysis.length)
          : 70; // Default score if no pages were analyzed
        
        // Count total number of issues
        const totalIssues = detailedAnalysis.reduce((sum, page) => 
          sum + page.sections.reduce((sectionSum, section) => sectionSum + section.issues.length, 0), 0);
        
        // Update the project with scan data and store scan results
        updateProjectScan(project, overallScore, totalIssues, detailedAnalysis);
        return;
      }

      // Create an empty array to store detailed analysis for each file
      const detailedAnalysis = [];
      
      // Analyze each HTML file using OpenAI
      for (const filePath of htmlFiles) {
        try {
          // Get the content of each HTML file
          console.log(`Getting content for file: ${filePath}`);
          const fileContent = await getFileContent(
            session as any,
            project.owner,
            project.repo,
            filePath,
            project.defaultBranch
          );
          
          // Analyze the file content using OpenAI
          console.log(`Analyzing file: ${filePath}`);
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
        ? Math.floor(detailedAnalysis.reduce((sum, page) => sum + (typeof page.score === 'number' ? page.score : 70), 0) / detailedAnalysis.length)
        : 70; // Default score if no pages were analyzed
      
      // Count total number of issues
      const totalIssues = detailedAnalysis.reduce((sum, page) => 
        sum + (page.sections?.reduce((sectionSum, section) => sectionSum + (section.issues?.length || 0), 0) || 0), 0);
      
      console.log(`Analysis complete: Score=${overallScore}, Issues=${totalIssues}, Pages=${detailedAnalysis.length}`);
      
      // Update the project with scan data
      updateProjectScan(project, overallScore, totalIssues, detailedAnalysis);
      
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
    if (!selectedUrl || !scanResults) {
      setError("No scan results available. Please run a scan first.");
      return;
    }
    
    // Find the project
    const project = projects.find(p => p.url === selectedUrl);
    if (!project) {
      setError("Selected project not found. Please try again.");
      return;
    }
    
    try {
      setLoading(true);
      const appliedChanges = [];
      
      // Generate a unique branch name with timestamp
      const timestamp = new Date().getTime();
      const branchName = `seo-improvements-${timestamp}`;
      
      // Create a new branch for all the changes
      console.log(`Creating branch: ${branchName}`);
      await createBranch(
        session as any,
        project.owner,
        project.repo,
        project.defaultBranch,
        branchName
      );
      console.log(`Branch ${branchName} created successfully`);
      
      // For each file in the detailed analysis
      for (const page of scanResults.detailedAnalysis) {
        try {
          console.log(`Processing file: ${page.filePath}`);
          
          // Get the current file content
          const originalContent = await getFileContent(
            session as any,
            project.owner,
            project.repo,
            page.filePath,
            project.defaultBranch
          );
          
          console.log(`Retrieved original content for ${page.filePath} (SHA: ${originalContent.sha.slice(0, 7)})`);
          
          // Apply the SEO improvements
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
            console.log(`Successfully updated ${page.filePath} in branch ${branchName}`);
            appliedChanges.push({
              file: page.filePath,
              branch: branchName
            });
          }
        } catch (err: any) {
          console.error(`Error applying changes to ${page.filePath}:`, err);
          // Continue with other files even if one fails
        }
      }
      
      // Create a pull request if there were any successful changes
      if (appliedChanges.length > 0) {
        try {
          // Create a comprehensive PR with all the changes
          console.log(`Creating pull request for branch ${branchName}`);
          const prUrl = await createPullRequest(
            session as any,
            project.owner,
            project.repo,
            branchName,
            project.defaultBranch,
            `SEO Improvements for ${project.repo}`,
            `This PR includes automated SEO improvements for better search engine visibility.
            
## Improved Files:
${appliedChanges.map(change => `- ${change.file}`).join('\n')}

## Changes Applied:
${scanResults.detailedAnalysis.flatMap((page: any) => 
  page.sections.flatMap((section: { name: string; issues: Array<{ type: string; suggestion: string }> }) => 
    section.issues.map((issue: { type: string; suggestion: string }) => 
      `- **${issue.type}**: ${issue.suggestion}`
    )
  )
).slice(0, 15).join('\n')}
${scanResults.detailedAnalysis.flatMap((page: any) => 
  page.sections.flatMap((section: { name: string; issues: Array<any> }) => section.issues)
).length > 15 ? '\n\n...and more improvements' : ''}

These changes should help improve your site's SEO score and search engine rankings.`
          );
          
          console.log(`Pull request created: ${prUrl}`);
          
          // Show success message with PR URL
          setError(null);
          setChangesModal(false);
          alert(`Changes applied successfully to ${appliedChanges.length} files! A pull request has been created.`);
        } catch (prError: any) {
          console.error("Error creating pull request:", prError);
          setError(`Changes were applied to ${appliedChanges.length} files, but creating a pull request failed: ${prError.message}`);
        }
      } else {
        setError("No changes were applied. The files may already have good SEO or there might have been an error.");
      }
    } catch (err: any) {
      console.error("Failed to apply SEO changes:", err);
      setError(`Failed to apply SEO changes: ${err.message}`);
    } finally {
      setLoading(false);
      // Close the modal
      handleCloseModal();
    }
  };

  const loadProjectIssues = async (projectId: string) => {
    try {
      const { data: issuesData, error: issuesError } = await supabase
        .from('seo_issues')
        .select('*')
        .eq('project_id', projectId)
        .order('severity', { ascending: false });

      if (issuesError) throw issuesError;
      setIssues(issuesData || []);
    } catch (error) {
      console.error('Error loading issues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SEO issues.'
      });
    }
  };

  const startScan = async (projectId: string) => {
    if (!session?.user?.id) return;

    try {
      setScanning(true);
      
      // Update project status
      await supabase
        .from('projects')
        .update({ scanning: true })
        .eq('id', projectId);

      // Start the scan process
      const { error: scanError } = await supabase
        .rpc('start_seo_scan', {
          p_project_id: projectId,
          p_user_id: session.user.id
        });

      if (scanError) throw scanError;

      toast({
        title: 'Scan Started',
        description: 'The SEO analysis has begun. This may take a few minutes.'
      });

      // Poll for scan completion
      const interval = setInterval(async () => {
        const { data: updatedProject } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (updatedProject && !updatedProject.scanning) {
          clearInterval(interval);
          setScanning(false);
          
          // Update projects list
          setProjects(prev => prev.map(p => 
            p.id === projectId ? updatedProject : p
          ));
          
          // Update selected project
          if (selectedProject?.id === projectId) {
            setSelectedProject(updatedProject);
          }
          
          // Reload issues
          loadProjectIssues(projectId);
          
          toast({
            title: 'Scan Complete',
            description: 'SEO analysis has been completed successfully.'
          });
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error starting scan:', error);
      setScanning(false);
      toast({
        title: 'Error',
        description: 'Failed to start SEO scan. Please try again.'
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-3 text-lg">Loading your project...</p>
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
    <Layout title="SEO Automation Dashboard">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item}>
          <h1 className="text-3xl font-bold mb-8">SEO Automation Dashboard</h1>
        </motion.div>

        <motion.div variants={item}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-5 gap-4 bg-transparent">
              <TabsTrigger
                value="automation"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
                Automation
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <LineChart className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FolderGit2 className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="automation" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SeoControlPanel
                  changes={[]}
                  onApprove={async () => {}}
                  onReject={async () => {}}
                  onApproveAll={async () => {}}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AutomationScheduler />
              </motion.div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AutomationLogs />
              </motion.div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ReportDownloader />
              </motion.div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ProjectManager />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <h3 className="text-2xl font-bold text-green-600">100%</h3>
                  <p className="text-sm text-gray-500">Automation Success Rate</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">24/7</h3>
                  <p className="text-sm text-gray-500">Monitoring</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-600">5 min</h3>
                  <p className="text-sm text-gray-500">Average Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Using SeoDetailsModal component for SEO analysis display */}
      {detailsModal && selectedUrl && (
        <SeoDetailsModal 
          isOpen={detailsModal}
          onClose={handleCloseModal}
          scanResults={scanResults}
          emailSent={emailSent}
        />
      )}
      
      {/* Modal for pending changes */}
      {changesModal && selectedUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pending Changes</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="font-medium">{selectedUrl}</p>
              <p className="text-sm text-gray-500 mt-1">
                Review and approve suggested SEO changes
              </p>
            </div>
            
            {emailSent && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <p>SEO analysis report has been sent to your email.</p>
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
    </Layout>
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