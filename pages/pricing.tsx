import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const plans = [
    {
      name: 'Free',
      description: 'For individuals getting started with SEO',
      price: {
        monthly: 0,
        annual: 0
      },
      features: [
        { included: true, text: 'Single repository scanning' },
        { included: true, text: 'Basic SEO analysis' },
        { included: true, text: 'Limited reports' },
        { included: false, text: 'Automated fixes' },
        { included: false, text: 'Email reports' },
        { included: false, text: 'API access' },
        { included: false, text: 'Team collaboration' }
      ],
      cta: 'Get Started',
      highlight: false
    },
    {
      name: 'Pro',
      description: 'Perfect for professionals and small teams',
      price: {
        monthly: 29,
        annual: 290
      },
      features: [
        { included: true, text: 'Up to 5 repositories' },
        { included: true, text: 'Advanced SEO analysis' },
        { included: true, text: 'Unlimited reports' },
        { included: true, text: 'Automated fixes' },
        { included: true, text: 'Weekly email reports' },
        { included: false, text: 'API access' },
        { included: false, text: 'Team collaboration' }
      ],
      cta: 'Start Trial',
      highlight: true
    },
    {
      name: 'Enterprise',
      description: 'For large teams and organizations',
      price: {
        monthly: 99,
        annual: 990
      },
      features: [
        { included: true, text: 'Unlimited repositories' },
        { included: true, text: 'Advanced SEO analysis' },
        { included: true, text: 'Unlimited reports' },
        { included: true, text: 'Automated fixes' },
        { included: true, text: 'Daily email reports' },
        { included: true, text: 'API access' },
        { included: true, text: 'Team collaboration' }
      ],
      cta: 'Contact Sales',
      highlight: false
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
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
        <section className="container mx-auto px-4 mb-16 text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Simple, Transparent <span className="text-primary">Pricing</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Choose the perfect plan for your needs. All plans include core SEO analysis features.
          </motion.p>
          
          <motion.div 
            className="inline-flex p-1 border border-border rounded-full bg-secondary mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual <span className="text-xs opacity-75">Save 15%</span>
            </button>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                variants={item}
                className={`relative bg-card border rounded-xl overflow-hidden ${
                  plan.highlight ? 'border-primary shadow-lg' : 'border-border'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-primary text-primary-foreground text-center text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className={`p-6 ${plan.highlight ? 'pt-12' : ''}`}>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price[billingPeriod]}</span>
                    {plan.price[billingPeriod] > 0 && (
                      <span className="text-muted-foreground">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  
                  <motion.button 
                    className={`w-full py-3 rounded-lg font-medium mb-8 ${
                      index === 1 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {plan.cta}
                  </motion.button>
                  
                  <div className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        )}
                        <span className={!feature.included ? 'text-muted-foreground' : ''}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
        
        <section className="container mx-auto px-4 max-w-4xl">
          <motion.div 
            className="bg-card border border-border rounded-xl p-8 md:p-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Have questions? We have answers.</p>
            </div>
            
            <div className="grid gap-6">
              {[
                {
                  question: 'How does the trial work?',
                  answer: 'Our Pro plan comes with a 14-day free trial. No credit card required. You can cancel anytime during the trial period.'
                },
                {
                  question: 'Can I change plans later?',
                  answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be prorated for the remainder of your billing cycle."
                },
                {
                  question: 'What payment methods do you accept?',
                  answer: 'We accept all major credit cards and PayPal. For Enterprise plans, we also offer invoicing.'
                },
                {
                  question: 'Is there a limit to how many repositories I can scan?',
                  answer: 'Free plans are limited to a single repository. Pro plans allow up to 5 repositories, and Enterprise plans have unlimited repositories.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="border-b border-border pb-6 last:border-0 last:pb-0">
                  <h3 className="font-medium text-lg mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
        
        <section className="container mx-auto px-4 mt-16">
          <motion.div 
            className="bg-primary/10 border border-primary/20 rounded-xl p-8 md:p-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Need a custom solution?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Our Enterprise plans can be customized to meet your specific needs. Contact our sales team to learn more.
            </p>
            <Link href="/contact">
              <motion.button 
                className="inline-flex items-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
              </motion.button>
            </Link>
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