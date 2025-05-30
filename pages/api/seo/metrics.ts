import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

// Initialize Google Search Console API
const searchconsole = google.searchconsole('v1');

async function getGoogleAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  return auth.getClient();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  switch (req.method) {
    case 'GET':
      try {
        const { repository_id, timeRange = '7d' } = req.query;

        if (!repository_id) {
          return res.status(400).json({ error: 'Repository ID is required' });
        }

        // Get the repository details to get the site URL
        const { data: repository, error: repoError } = await supabase
          .from('repositories')
          .select('*')
          .eq('id', repository_id)
          .eq('user_id', userId)
          .single();

        if (repoError) throw repoError;

        if (!repository) {
          return res.status(404).json({ error: 'Repository not found' });
        }

        // Calculate date range based on timeRange
        const endDate = new Date();
        const startDate = new Date();
        switch (timeRange) {
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
          default: // 7d
            startDate.setDate(startDate.getDate() - 7);
        }

        // First, try to get metrics from our database
        const { data: existingMetrics, error: metricsError } = await supabase
          .from('seo_performance_metrics')
          .select('*')
          .eq('repository_id', repository_id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (metricsError) throw metricsError;

        // If we have all the data in our database, return it
        if (existingMetrics.length > 0) {
          return res.status(200).json(existingMetrics);
        }

        // If we don't have data, fetch it from Google Search Console
        try {
          const auth = await getGoogleAuthClient();
          const response = await searchconsole.searchanalytics.query({
            auth: auth as any, // Type assertion needed due to Google API types mismatch
            siteUrl: repository.url,
            requestBody: {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ['date'],
            },
          });

          if (!response.data.rows) {
            return res.status(200).json([]);
          }

          // Transform and store the data
          const metrics = response.data.rows.map((row: any) => ({
            repository_id: repository_id,
            url: repository.url,
            date: row.keys[0],
            clicks: row.clicks,
            impressions: row.impressions,
            average_position: row.position,
          }));

          // Store the metrics in our database
          const { data: storedMetrics, error: storeError } = await supabase
            .from('seo_performance_metrics')
            .insert(metrics)
            .select();

          if (storeError) throw storeError;

          return res.status(200).json(storedMetrics);
        } catch (gscError) {
          console.error('Error fetching from Google Search Console:', gscError);
          // If GSC fails, return whatever data we have in our database
          return res.status(200).json(existingMetrics || []);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        return res.status(500).json({ error: 'Failed to fetch metrics' });
      }

    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 