import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Repository {
  id: number;
  name: string;
  owner: {
    login: string;
  };
  default_branch: string;
  html_url: string;
}

export default function RepositorySelection() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.accessToken) {
      router.push('/auth/signin');
      return;
    }

    async function fetchRepositories() {
      try {
        setLoading(true);
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
          headers: {
            Authorization: `token ${session!.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.statusText}`);
        }

        const data = await response.json();
        setRepositories(data);
      } catch (error) {
        console.error('Error fetching repositories:', error);
        setError('Failed to load repositories');
        toast({
          title: 'Error',
          description: 'Failed to load your GitHub repositories. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRepositories();
  }, [session?.accessToken, status, router, toast, session]);

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.owner.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectRepository = async (repo: Repository) => {
    if (!session?.user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to select a repository.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      setSelectedRepo(repo);

      // Check if project already exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('owner', repo.owner.login)
        .eq('repo', repo.name)
        .single();

      if (existingProject) {
        toast({
          title: 'Project Exists',
          description: 'This repository is already in your projects.',
          variant: 'default',
        });
        return;
      }
      
      // Save to database
      const { data: project, error: dbError } = await supabase
        .from('projects')
        .insert({
          name: repo.name,
          owner: repo.owner.login,
          repo: repo.name,
          default_branch: repo.default_branch,
          user_id: session.user.id
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'Success',
        description: 'Repository added successfully!',
        variant: 'default',
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving repository:', error);
      toast({
        title: 'Error',
        description: 'Failed to save repository. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setSelectedRepo(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.accessToken) {
    return null; // Router will handle redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="mt-8 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Select a Repository</h1>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-4">
            {filteredRepositories.map((repo) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{repo.name}</h3>
                    <p className="text-sm text-muted-foreground">{repo.owner.login}</p>
                  </div>
                  <Button
                    onClick={() => handleSelectRepository(repo)}
                    disabled={saving && selectedRepo?.id === repo.id}
                  >
                    {saving && selectedRepo?.id === repo.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Selecting...
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}

            {filteredRepositories.length === 0 && (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No repositories found matching your search.' : 'No repositories available.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 