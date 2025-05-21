import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { 
  CheckCircle, 
  BarChart, 
  Code, 
  LineChart, 
  Mail, 
  Lock, 
  Github, 
  Globe, 
  ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function Features() {
  const [activeTab, setActiveTab] = useState('all');
  
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

  const features = [
    {
      id: 'analysis',
      title: 'Comprehensive SEO Analysis',
      description: "Detailed analysis of your website's SEO health with specific recommendations for improvement",
      icon: <BarChart className="h-8 w-8 text-primary" />,
      categories: ['all', 'core']
    },
    {
      id: 'scoring',
      title: 'SEO Score Tracking',
      description: 'Track your SEO score over time and see how your improvements impact your ranking potential',
      icon: <LineChart className="h-8 w-8 text-primary" />,
      categories: ['all', 'analytics']
    },
    {
      id: 'github',
      title: 'GitHub Integration',
      description: 'Connect your GitHub repositories and automatically analyze HTML files for SEO improvements',
      icon: <Github className="h-8 w-8 text-primary" />,
      categories: ['all', 'core', 'integrations']
    },
    {
      id: 'automated',
      title: 'Automated SEO Fixes',
      description: 'One-click solution to apply recommended SEO changes through GitHub pull requests',
      icon: <Code className="h-8 w-8 text-primary" />,
      categories: ['all', 'core']
    },
    {
      id: 'email',
      title: 'Email Reports',
      description: 'Receive detailed email reports with SEO analysis and recommendations',
      icon: <Mail className="h-8 w-8 text-primary" />,
      categories: ['all', 'notifications']
    },
    {
      id: 'keywords',
      title: 'Keyword Optimization',
      description: 'Get keyword suggestions and optimize your content for better search engine rankings',
      icon: <Globe className="h-8 w-8 text-primary" />,
      categories: ['all', 'core', 'analytics']
    },
    {
      id: 'security',
      title: 'Secure Authentication',
      description: 'Industry-standard security with OAuth authentication for your GitHub repositories',
      icon: <Lock className="h-8 w-8 text-primary" />,
      categories: ['all', 'security']
    },
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      description: 'Track your SEO progress with detailed analytics and visualizations',
      icon: <BarChart className="h-8 w-8 text-primary" />,
      categories: ['all', 'analytics']
    }
  ];

  const filteredFeatures = features.filter(feature => 
    feature.categories.includes(activeTab)
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <section className="container mx-auto px-4 mb-20 text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Powerful <span className="text-primary">Features</span> to Boost Your SEO
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Our SEO automation platform provides all the tools you need to improve your website's visibility
            and rank higher in search engine results.
          </motion.p>
        </section>
        
        <section className="container mx-auto px-4 mb-16">
          <motion.div 
            className="flex justify-center mb-12 border-b border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex space-x-6 overflow-x-auto pb-1">
              {['all', 'core', 'analytics', 'integrations', 'notifications', 'security'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-b-2 border-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground transition-colors'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredFeatures.map((feature) => (
              <motion.div
                key={feature.id}
                variants={item}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all duration-300 hover:shadow-md"
              >
                <div className="p-3 bg-primary/10 inline-block rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <Link href="/dashboard" className="inline-flex items-center text-primary hover:underline">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
        
        <section className="container mx-auto px-4 mb-20">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <motion.div 
              className="p-8 md:p-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6">Ready to Improve Your SEO?</h2>
                <p className="text-muted-foreground mb-8">
                  Start optimizing your website today and see the difference in your search engine rankings.
                </p>
                <Link href="/dashboard">
                  <motion.button 
                    className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        
        <section className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {[
              'Detailed SEO Analysis', 
              'Keyword Optimization', 
              'Technical SEO Fixes', 
              'Regular Reports',
              'Performance Tracking',
              'Content Recommendations',
              'Meta Tags Optimization',
              'Internal Link Analysis'
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-center py-3"
              >
                <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </motion.div>
        </section>
      </main>
      
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>SEO Optimization Platform &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
} 