import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, getSession, signOut } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Header from '@/components/Header';
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Key, 
  Globe,
  LogOut, 
  Github, 
  Loader2, 
  ArrowRight, 
  Check,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

type NotificationSetting = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export default function Settings() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectedRepository, setSelectedRepository] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'seo-reports',
      name: 'SEO Reports',
      description: 'Receive weekly email reports on SEO performance',
      enabled: true
    },
    {
      id: 'issue-alerts',
      name: 'Issue Alerts',
      description: 'Get notified when new SEO issues are found',
      enabled: true
    },
    {
      id: 'pr-notifications',
      name: 'Pull Request Updates',
      description: 'Notifications when SEO improvements are submitted via PR',
      enabled: false
    },
    {
      id: 'score-changes',
      name: 'Score Changes',
      description: 'Get alerted when your SEO score changes significantly',
      enabled: true
    }
  ]);
  const [saving, setSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: process.env.OPENAI_API_KEY ? '···········' : '',
    resend: process.env.RESEND_API_KEY ? '···········' : '',
    github: process.env.GITHUB_TOKEN ? '···········' : ''
  });

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

  const toggleNotification = (id: string) => {
    setNotificationSettings(notificationSettings.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const handleSaveSettings = () => {
    setSaving(true);
    // Simulate API call to save settings
    setTimeout(() => {
      setSaving(false);
    }, 1500);
  };

  const handleChangeRepository = () => {
    localStorage.removeItem('selectedRepository');
    router.push('/auth/repository-selection');
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Please sign in to access settings</p>
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
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeTab === 'profile' 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'hover:bg-secondary'
                }`}
              >
                <User className={`h-5 w-5 mr-3 ${activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={activeTab === 'profile' ? 'font-medium' : ''}>Profile</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeTab === 'notifications' 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'hover:bg-secondary'
                }`}
              >
                <Bell className={`h-5 w-5 mr-3 ${activeTab === 'notifications' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={activeTab === 'notifications' ? 'font-medium' : ''}>Notifications</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('api')}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeTab === 'api' 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'hover:bg-secondary'
                }`}
              >
                <Key className={`h-5 w-5 mr-3 ${activeTab === 'api' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={activeTab === 'api' ? 'font-medium' : ''}>API Keys</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center w-full px-4 py-3 text-left ${
                  activeTab === 'security' 
                    ? 'bg-primary/10 border-l-4 border-primary' 
                    : 'hover:bg-secondary'
                }`}
              >
                <Shield className={`h-5 w-5 mr-3 ${activeTab === 'security' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={activeTab === 'security' ? 'font-medium' : ''}>Security</span>
              </button>
              
              <button 
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-left text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
                
                <div className="grid gap-6 mb-8">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input 
                      type="text" 
                      value={session.user?.name || ''} 
                      className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      readOnly 
                    />
                    <p className="text-xs text-muted-foreground">This name is synced from your GitHub account</p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input 
                      type="email" 
                      value={session.user?.email || ''} 
                      className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      readOnly 
                    />
                    <p className="text-xs text-muted-foreground">This email is synced from your GitHub account</p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Selected Repository</label>
                    <div className="flex items-center">
                      <div className="flex-1 px-4 py-2 border border-input rounded-md bg-secondary/30">
                        {selectedRepository ? `${selectedRepository.owner}/${selectedRepository.repo}` : 'No repository selected'}
                      </div>
                      <button 
                        onClick={handleChangeRepository}
                        className="ml-3 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">The repository you are currently analyzing</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveSettings}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
                
                <div className="space-y-6 mb-8">
                  {notificationSettings.map((setting) => (
                    <div key={setting.id} className="flex items-start justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                      <div>
                        <h3 className="font-medium">{setting.name}</h3>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <button 
                        onClick={() => toggleNotification(setting.id)}
                        className={`w-12 h-6 rounded-full relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                          setting.enabled ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span 
                          className={`block w-4 h-4 rounded-full absolute top-1 transition-transform ${
                            setting.enabled ? 'bg-white translate-x-7' : 'bg-gray-400 translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mb-8">
                  <h3 className="font-medium mb-3">Email Delivery Schedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border border-primary bg-primary/5 rounded-md p-3 flex items-center">
                      <input 
                        type="radio" 
                        id="schedule-weekly" 
                        name="schedule" 
                        checked 
                        className="mr-3"
                      />
                      <label htmlFor="schedule-weekly">Weekly</label>
                    </div>
                    <div className="border border-input rounded-md p-3 flex items-center">
                      <input 
                        type="radio" 
                        id="schedule-biweekly" 
                        name="schedule"
                        className="mr-3"
                      />
                      <label htmlFor="schedule-biweekly">Bi-weekly</label>
                    </div>
                    <div className="border border-input rounded-md p-3 flex items-center">
                      <input 
                        type="radio" 
                        id="schedule-monthly" 
                        name="schedule"
                        className="mr-3"
                      />
                      <label htmlFor="schedule-monthly">Monthly</label>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveSettings}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
            
            {activeTab === 'api' && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-6">API Keys</h2>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium">OpenAI API Key</label>
                      <span className={`text-xs px-2 py-1 rounded ${apiKeys.openai ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {apiKeys.openai ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex">
                      <input
                        type="password"
                        value={apiKeys.openai}
                        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="flex-1 px-4 py-2 border border-input rounded-l-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button className="px-4 py-2 bg-secondary border-r border-t border-b border-input rounded-r-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Required for AI-powered SEO analysis</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium">Resend API Key</label>
                      <span className={`text-xs px-2 py-1 rounded ${apiKeys.resend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {apiKeys.resend ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex">
                      <input
                        type="password"
                        value={apiKeys.resend}
                        placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="flex-1 px-4 py-2 border border-input rounded-l-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button className="px-4 py-2 bg-secondary border-r border-t border-b border-input rounded-r-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Required for email notifications</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium">GitHub Personal Access Token</label>
                      <span className={`text-xs px-2 py-1 rounded ${apiKeys.github ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {apiKeys.github ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex">
                      <input
                        type="password"
                        value={apiKeys.github}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="flex-1 px-4 py-2 border border-input rounded-l-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button className="px-4 py-2 bg-secondary border-r border-t border-b border-input rounded-r-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Required for repository access with write permissions</p>
                  </div>
                </div>
                
                <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-md">
                  <div className="flex items-start">
                    <Globe className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      API keys are stored securely and are only used for the specified integrations. 
                      For security, keys are never displayed in full once saved.
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveSettings}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <h3 className="font-medium mb-3">Connected Accounts</h3>
                    <div className="border border-input rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-[#24292F] p-2 rounded-full mr-3">
                            <Github className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">GitHub</div>
                            <div className="text-sm text-muted-foreground">{session.user?.email}</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Connected</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Session Management</h3>
                    <div className="border border-input rounded-md overflow-hidden">
                      <div className="p-4 border-b border-input">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium">Current Session</div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Active</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Started: {new Date().toLocaleString()}</div>
                      </div>
                      <div className="p-4 flex justify-end">
                        <button 
                          onClick={handleSignOut}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <LogOut className="mr-1.5 h-3.5 w-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Access Permissions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Repository Access</div>
                          <div className="text-sm text-muted-foreground">Access to repositories via GitHub API</div>
                        </div>
                        <span className="flex items-center text-green-600">
                          <Check className="h-4 w-4 mr-1" />
                          Granted
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Create Pull Requests</div>
                          <div className="text-sm text-muted-foreground">Permission to create PRs for SEO improvements</div>
                        </div>
                        <span className="flex items-center text-green-600">
                          <Check className="h-4 w-4 mr-1" />
                          Granted
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Email Contact</div>
                          <div className="text-sm text-muted-foreground">Permission to send email notifications</div>
                        </div>
                        <span className="flex items-center text-green-600">
                          <Check className="h-4 w-4 mr-1" />
                          Granted
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start p-4 bg-yellow-50 text-yellow-700 rounded-md mb-8">
                  <Shield className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
                  <p className="text-sm">
                    For security reasons, some settings can only be changed through your GitHub account. 
                    We recommend enabling two-factor authentication for additional security.
                  </p>
                </div>
                
                <button 
                  onClick={handleSaveSettings}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Permissions
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-6 mt-12">
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