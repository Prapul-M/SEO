import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { createBrowserClient } from '@supabase/ssr';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ["latin"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const [supabaseClient] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  return (
    <>
      <Head>
        <title>SEO Automation App</title>
        <meta
          name="description"
          content="AI-powered SEO automation for your website"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SessionContextProvider supabaseClient={supabaseClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider session={session}>
            <main className={inter.className}>
              <Component {...pageProps} />
            </main>
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </SessionContextProvider>
    </>
  );
} 