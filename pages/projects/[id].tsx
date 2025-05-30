import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, GitBranch, ArrowLeft, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  owner: string;
  default_branch: string;
  last_scan_at: string | null;
  seo_score: number | null;
  scanning: boolean;
}

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Load project details
  useEffect(() => {
    async function loadProject() {
      if (!id || !session?.user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Project not found');

        setProject(data);

        // Load SEO issues
        const { data: issuesData, error: issuesError } = await supabase
          .from('seo_issues')
          .select('*')
          .eq('project_id', id)
          .order('severity', { ascending: false });

        if (issuesError) throw issuesError;
        setIssues(issuesData || []);

      } catch (error) {
        console.error('Error loading project:', error);
        setError('Failed to load project details');
        toast({
          title: 'Error',
          description: 'Failed to load project details. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id, session?.user?.id, supabase, toast]);

  const startScan = async () => {
    if (!project || !session?.user?.id) return;

    try {
      setScanning(true);
      setScanProgress(0);
      
      // Update project status
      await supabase
        .from('projects')
        .update({ scanning: true })
        .eq('id', project.id);

      // Start the scan process
      const { error: scanError } = await supabase
        .rpc('start_seo_scan', {
          p_project_id: project.id,
          p_user_id: session.user.id
        });

      if (scanError) throw scanError;

      toast({
        title: 'Scan Started',
        description: 'The SEO analysis has begun. This may take a few minutes.'
      });

      // Progress animation
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Poll for scan completion
      const interval = setInterval(async () => {
        const { data: updatedProject } = await supabase
          .from('projects')
          .select('scanning, last_scan_at, seo_score')
          .eq('id', project.id)
          .single();

        if (updatedProject && !updatedProject.scanning) {
          clearInterval(interval);
          clearInterval(progressInterval);
          setScanProgress(100);
          setScanning(false);
          setProject(prev => prev ? { ...prev, ...updatedProject } : null);
          
          // Reload issues
          const { data: newIssues } = await supabase
            .from('seo_issues')
            .select('*')
            .eq('project_id', project.id)
            .order('severity', { ascending: false });
          
          setIssues(newIssues || []);
          
          toast({
            title: 'Scan Complete',
            description: 'SEO analysis has been completed successfully.'
          });
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    } catch (error) {
      console.error('Error starting scan:', error);
      setScanning(false);
      setScanProgress(0);
      toast({
        title: 'Error',
        description: 'Failed to start SEO scan. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link href="/dashboard">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4 inline-block mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold mt-2">{project.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{project.owner}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  {project.default_branch}
                </span>
              </div>
            </div>

            <Button
              onClick={startScan}
              disabled={scanning}
              className="flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Run New Scan
                </>
              )}
            </Button>
          </div>

          {project.seo_score !== null && (
            <div className="mt-6 flex items-center gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
                <div className={`text-2xl font-bold ${
                  project.seo_score >= 80 ? 'text-green-500' :
                  project.seo_score >= 60 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {project.seo_score}%
                </div>
                <div className="text-sm">
                  <div className="font-medium">SEO Score</div>
                  <div className="text-muted-foreground">
                    Last updated: {project.last_scan_at ? new Date(project.last_scan_at).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <AnimatePresence>
            {issues.map((issue) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">{issue.type}</span>
                    </div>
                    <h3 className="text-lg font-medium mb-1">{issue.page_url}</h3>
                    <p className="text-muted-foreground mb-4">{issue.description}</p>
                    
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                        <Info className="h-4 w-4" />
                        AI Suggestion
                      </div>
                      <p className="text-sm">{issue.suggestion}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {issue.fixed ? (
                      <span className="inline-flex items-center text-green-500">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        Fixed
                      </span>
                    ) : (
                      <Button variant="outline" size="sm">
                        Mark as Fixed
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {issues.length === 0 && !scanning && (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No SEO Issues Found</h3>
              <p className="text-muted-foreground">
                {project.last_scan_at 
                  ? 'Great job! Your website is well optimized for search engines.'
                  : 'Run your first scan to get SEO suggestions for your website.'}
              </p>
            </div>
          )}

          {scanning && (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Analyzing Your Website</h3>
              <p className="text-muted-foreground mb-4">
                We're scanning your pages and generating AI-powered SEO suggestions.
                This may take a few minutes.
              </p>
              <div className="max-w-md mx-auto">
                <Progress value={scanProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">{Math.round(scanProgress)}% Complete</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 