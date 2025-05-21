import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { 
  BookOpen, 
  Code, 
  Settings, 
  FileText, 
  LifeBuoy, 
  Github, 
  Search, 
  ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

export default function Documentation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');

  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      id: 'api-reference',
      name: 'API Reference',
      icon: <Code className="h-5 w-5" />
    },
    {
      id: 'configuration',
      name: 'Configuration',
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'guides',
      name: 'Guides',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'support',
      name: 'Support',
      icon: <LifeBuoy className="h-5 w-5" />
    }
  ];

  const articles = [
    {
      id: 'github-integration',
      title: 'Setting up GitHub Integration',
      description: 'Connect your GitHub repositories for SEO analysis',
      category: 'getting-started',
      new: true
    },
    {
      id: 'scanning-repos',
      title: 'Scanning Your First Repository',
      description: 'Learn how to scan your GitHub repositories for SEO issues',
      category: 'getting-started'
    },
    {
      id: 'understanding-scores',
      title: 'Understanding SEO Scores',
      description: 'How to interpret the SEO scores and metrics',
      category: 'getting-started'
    },
    {
      id: 'api-authentication',
      title: 'API Authentication',
      description: 'How to authenticate with the SEO Automation API',
      category: 'api-reference'
    },
    {
      id: 'api-endpoints',
      title: 'API Endpoints Reference',
      description: 'Complete list of all API endpoints and parameters',
      category: 'api-reference'
    },
    {
      id: 'webhooks',
      title: 'Setting Up Webhooks',
      description: 'Configure webhooks for SEO events and notifications',
      category: 'api-reference'
    },
    {
      id: 'env-variables',
      title: 'Environment Variables',
      description: 'Configure the application with environment variables',
      category: 'configuration'
    },
    {
      id: 'nextauth-setup',
      title: 'NextAuth Configuration',
      description: 'Setting up authentication in your deployment',
      category: 'configuration'
    },
    {
      id: 'customizing-reports',
      title: 'Customizing Email Reports',
      description: 'How to customize the content and scheduling of email reports',
      category: 'guides'
    },
    {
      id: 'fixing-issues',
      title: 'Fixing Common SEO Issues',
      description: 'Step-by-step guide to fix common SEO issues found by the scanner',
      category: 'guides'
    },
    {
      id: 'deployment',
      title: 'Deployment Guide',
      description: 'How to deploy the SEO Automation app to production',
      category: 'guides'
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Answers to common questions about the platform',
      category: 'support'
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting Guide',
      description: 'Solutions to common issues you might encounter',
      category: 'support'
    }
  ];

  const filteredArticles = articles.filter(article => 
    article.category === activeCategory && 
    (searchTerm === '' || 
     article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     article.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="flex flex-col items-center text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Everything you need to know about using the SEO Automation Platform.
            </p>
          </motion.div>
          
          <motion.div 
            className="max-w-4xl mx-auto mb-12 relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-12 pr-4 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </motion.div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <motion.div 
              className="w-full md:w-64 shrink-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center w-full px-4 py-3 text-left ${
                      activeCategory === category.id
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <span className={`${activeCategory === category.id ? 'text-primary' : 'text-muted-foreground'} mr-3`}>
                      {category.icon}
                    </span>
                    <span className={activeCategory === category.id ? 'font-medium' : ''}>
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Github className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-medium">Open Source</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Our project is open source. Contribute on GitHub.
                </p>
                <a 
                  href="https://github.com/yourusername/seo-automation" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  View on GitHub <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex-1"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <h2 className="text-2xl font-bold mb-6">
                {categories.find(c => c.id === activeCategory)?.name}
              </h2>
              
              {filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => (
                    <motion.div
                      key={article.id}
                      variants={item}
                      className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium">
                          <Link href={`/documentation/${article.id}`} className="hover:text-primary">
                            {article.title}
                          </Link>
                        </h3>
                        {article.new && (
                          <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">New</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">{article.description}</p>
                      <Link 
                        href={`/documentation/${article.id}`}
                        className="text-sm text-primary hover:underline inline-flex items-center"
                      >
                        Read More <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="bg-card border border-border rounded-lg p-8 text-center"
                  variants={item}
                >
                  <p className="text-muted-foreground mb-2">No articles found matching your search criteria.</p>
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="text-primary hover:underline"
                  >
                    Clear search
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>SEO Optimization Platform &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
} 