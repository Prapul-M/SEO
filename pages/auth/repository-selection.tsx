import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getUserRepositories, GithubRepo } from '@/lib/github';
import { Octokit } from '@octokit/rest';
import { Github, Search, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function RepositorySelection() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [repositories, setRepositories] = useState<GithubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GithubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchRepositories();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRepos(repositories);
    } else {
      const filtered = repositories.filter(
        repo => repo.repo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRepos(filtered);
    }
  }, [searchTerm, repositories]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      const repos = await getUserRepositories(session as any);
      setRepositories(repos);
      setFilteredRepos(repos);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setError('Failed to load your repositories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepository = (repoId: string) => {
    setSelectedRepo(repoId);
  };

  const handleContinue = () => {
    if (!selectedRepo) return;
    
    // Split the selected repo ID to get owner and repo name
    const [owner, repo] = selectedRepo.split('/');
    
    // Save selection to localStorage
    const selectedRepoData = repositories.find(
      r => r.owner === owner && r.repo === repo
    );
    
    if (selectedRepoData) {
      localStorage.setItem('selectedRepository', JSON.stringify(selectedRepoData));
      router.push('/dashboard');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl">Loading your repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold">
              <span>SEO</span>
              <span className="text-primary">AI</span>
            </h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Select a Repository</h1>
        <p className="text-muted-foreground text-center mb-8">
          Choose a GitHub repository to analyze and optimize for SEO
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
            <button 
              onClick={fetchRepositories} 
              className="underline ml-2"
            >
              Try again
            </button>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-2 pr-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-4">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-md">
              <Github className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "No matching repositories found. Try a different search term." 
                  : "No repositories found. Make sure you have repositories on GitHub."}
              </p>
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <div
                key={`${repo.owner}/${repo.repo}`}
                className={`border ${
                  selectedRepo === `${repo.owner}/${repo.repo}`
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } rounded-md p-4 cursor-pointer transition-all`}
                onClick={() => handleSelectRepository(`${repo.owner}/${repo.repo}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedRepo === `${repo.owner}/${repo.repo}` 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {selectedRepo === `${repo.owner}/${repo.repo}` && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-lg">{repo.repo}</h3>
                      <p className="text-muted-foreground text-sm">{repo.owner}</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Default branch: {repo.defaultBranch}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRepo}
            className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Continue to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </button>
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
  
  // Check if user has already selected a repository
  const { selectedRepo } = context.req.cookies;
  
  // If repository is already selected, redirect to dashboard
  if (selectedRepo) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
}; 