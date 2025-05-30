import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Project {
  id: string;
  name: string;
  owner: string;
  user_id: string;
  default_branch: string;
  created_at: string;
  automation_enabled: boolean;
  last_scan_at?: string;
  seo_score?: number;
  scan_history?: Array<{
    date: string;
    score: number;
  }>;
}

export interface SeoScan {
  id: string;
  project_id: string;
  created_at: string;
  score: number;
  issues_found: number;
  scan_details: any;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  timezone: string;
  automation_schedule: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
} 