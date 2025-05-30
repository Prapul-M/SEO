import { useEffect } from 'react';
import { motion } from 'framer-motion';
import HomepageAnimation from '@/components/HomepageAnimation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold">SEO AI</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-x-4"
          >
            <Button
              variant="ghost"
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/auth/signup')}
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24">
        <section className="min-h-screen flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              AI-Powered SEO Automation
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Optimize your website&apos;s SEO with the power of artificial intelligence.
              Get real-time insights, automated improvements, and stay ahead of the competition.
            </p>
          </motion.div>

          <HomepageAnimation />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 space-x-4"
          >
            <Button
              size="lg"
              onClick={() => router.push('/auth/signup')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Start Optimizing Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/features')}
            >
              Learn More
            </Button>
          </motion.div>
        </section>

        <section className="py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-lg">
              <h3 className="text-xl font-bold mb-4">Automated Analysis</h3>
              <p className="text-gray-300">
                Our AI continuously analyzes your website&apos;s performance and provides
                actionable insights for improvement.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-lg">
              <h3 className="text-xl font-bold mb-4">Smart Optimization</h3>
              <p className="text-gray-300">
                Get AI-powered recommendations for content, meta tags, and technical
                SEO improvements.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-lg">
              <h3 className="text-xl font-bold mb-4">Real-time Monitoring</h3>
              <p className="text-gray-300">
                Track your SEO performance in real-time and receive instant alerts
                about critical issues.
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-black/50 backdrop-blur-lg py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">SEO AI</h3>
              <p className="text-gray-400">
                Next-generation SEO automation powered by artificial intelligence.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Automated Analysis</li>
                <li>Smart Optimization</li>
                <li>Real-time Monitoring</li>
                <li>Performance Tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Blog</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Careers</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SEO AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 