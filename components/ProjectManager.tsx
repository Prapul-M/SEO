import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, GitBranch, Settings, Play, Pause, Plus, LineChart, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Project {
  id: string;
  name: string;
  owner: string;
  user_id: string;
  default_branch: string;
  created_at: string;
  automation_enabled: boolean;
  last_scan_at: string | null;
  seo_score: number | null;
  scan_history?: any[];
}

export default function ProjectManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [automationLoading, setAutomationLoading] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_projects', {
          p_user_id: session.user.id
        });

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects');
      toast({
        title: 'Error',
        description: 'Failed to load projects. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, supabase, toast]);

  useEffect(() => {
    if (session?.user?.id) {
      loadProjects();
    }
  }, [loadProjects, session?.user?.id]);

  const deleteProject = async (id: string) => {
    try {
      setDeletingId(id);
      const { error } = await supabase
        .rpc('delete_user_project', {
          p_project_id: id,
          p_user_id: session?.user?.id
        });

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== id));
      toast({
        title: 'Success',
        description: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAutomation = async (projectId: string, currentState: boolean) => {
    try {
      setAutomationLoading(projectId);
      const { error } = await supabase
        .rpc('toggle_project_automation', {
          p_project_id: projectId,
          p_user_id: session?.user?.id,
          p_enabled: !currentState
        });

      if (error) throw error;

      setProjects(projects.map(p => 
        p.id === projectId 
          ? { ...p, automation_enabled: !currentState }
          : p
      ));

      toast({
        title: 'Success',
        description: `Automation ${!currentState ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update automation settings'
      });
    } finally {
      setAutomationLoading(null);
    }
  };

  const startScan = async (projectId: string) => {
    try {
      setAutomationLoading(projectId);
      
      // Start the scan
      const { error: scanError } = await supabase
        .rpc('start_seo_scan', {
          p_project_id: projectId,
          p_user_id: session?.user?.id
        });

      if (scanError) throw scanError;

      toast({
        title: 'Scan Started',
        description: 'SEO analysis has begun. This may take a few minutes.'
      });

      // Poll for scan completion
      const interval = setInterval(async () => {
        const { data: project } = await supabase
          .from('projects')
          .select('scanning, last_scan_at, seo_score')
          .eq('id', projectId)
          .single();

        if (project && !project.scanning) {
          clearInterval(interval);
          setAutomationLoading(null);
          
          // Update project in state
          setProjects(prevProjects => 
            prevProjects.map(p => 
              p.id === projectId 
                ? { ...p, ...project }
                : p
            )
          );
          
          toast({
            title: 'Scan Complete',
            description: 'SEO analysis has been completed successfully.'
          });
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error starting scan:', error);
      setAutomationLoading(null);
      toast({
        title: 'Error',
        description: 'Failed to start SEO scan. Please try again.'
      });
    }
  };

  const addNewProject = () => {
    router.push('/auth/repository-selection');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadProjects}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={addNewProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first GitHub repository to start optimizing your SEO
          </p>
          <Button onClick={addNewProject} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-medium">{project.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{project.owner}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-4 w-4" />
                        {project.default_branch}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startScan(project.id)}
                      disabled={automationLoading === project.id}
                    >
                      {automationLoading === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                      disabled={deletingId === project.id}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {project.scan_history && project.scan_history.length > 0 && (
                  <div className="mt-4 h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={project.scan_history}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value: number) => [`${value}%`, 'SEO Score']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {project.seo_score !== null && (
                      <span className="flex items-center gap-1">
                        <LineChart className="h-4 w-4" />
                        SEO Score: {project.seo_score}%
                      </span>
                    )}
                    {project.last_scan_at && (
                      <span className="text-muted-foreground">
                        Last scan: {new Date(project.last_scan_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-primary hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
} 