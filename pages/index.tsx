import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Github, Star } from "lucide-react";
import Header from "@/components/Header";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-10">
        <section className="py-20 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
              AI-Powered SEO Automation
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Automatically improve your website's SEO with GPT-4 Turbo. 
              Connect your GitHub repository and let our AI optimize your meta tags, headings, 
              and content with trending keywords.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <Link href="/dashboard">
                  <button className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </Link>
              ) : (
                <button 
                  onClick={() => signIn("github")}
                  className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
                >
                  <Github className="mr-2 h-4 w-4" /> Sign in with GitHub
                </button>
              )}
              <Link href="#features">
                <button className="inline-flex items-center px-6 py-3 rounded-md bg-secondary text-secondary-foreground font-medium transition-colors hover:bg-secondary/80">
                  Learn more
                </button>
              </Link>
            </div>
          </motion.div>
        </section>
        
        <section id="features" className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform automatically analyzes and optimizes your website's SEO elements
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-lg p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
        
        <section className="py-20">
          <div className="bg-card rounded-lg p-8 border border-border">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Ready to boost your SEO?</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your GitHub repository and let our AI handle your SEO optimization.
                  Daily scans, trending keywords, and automatic improvement suggestions.
                </p>
                {session ? (
                  <Link href="/dashboard">
                    <button className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90">
                      Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </Link>
                ) : (
                  <button 
                    onClick={() => signIn("github")}
                    className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
                  >
                    <Github className="mr-2 h-4 w-4" /> Sign in with GitHub
                  </button>
                )}
              </div>
              <div className="relative h-60 rounded-lg overflow-hidden">
                <Image 
                  src="/dashboard-preview.png" 
                  alt="Dashboard Preview" 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} SEO Automation App. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/yourusername/seo-automation-app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Daily GitHub Scans",
    description: "Automatically scan your websites connected via GitHub repositories every day.",
    icon: <Github className="h-6 w-6 text-primary" />,
  },
  {
    title: "AI-Powered SEO Analysis",
    description: "GPT-4 Turbo analyzes and optimizes your meta tags, headings, alt text, and more.",
    icon: <Star className="h-6 w-6 text-primary" />,
  },
  {
    title: "Trending Keywords",
    description: "Fetch trending keywords from Google Trends to keep your content relevant.",
    icon: <ArrowRight className="h-6 w-6 text-primary" />,
  },
]; 