export interface UserPreferences {
  id: string;
  user_id: string;
  timezone: string;
  automation_schedule?: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeoAutomationLog {
  id: string;
  user_id: string;
  repository_id: string;
  status: 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  changes_count: number;
  pull_request_number?: number;
}

export interface SeoChange {
  id: string;
  automation_log_id: string;
  file_path: string;
  element_type: 'title' | 'meta-description' | 'heading' | 'alt-text' | 'content';
  old_value: string;
  new_value: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  applied_at?: string;
  created_at: string;
}

export interface SeoPerformanceMetrics {
  id: string;
  repository_id: string;
  url: string;
  clicks: number;
  impressions: number;
  average_position: number;
  date: string;
  created_at: string;
}

export interface Repository {
  id: string;
  user_id: string;
  name: string;
  owner: string;
  default_branch: string;
  is_active: boolean;
  automation_enabled: boolean;
  last_scan_at?: string;
  seo_score?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  created_at: string;
}

export interface SeoScan {
  id: string;
  repository_id: string;
  score: number;
  issues_count: number;
  created_at: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface SeoIssue {
  id: string;
  scan_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  element?: string;
  suggestion?: string;
  file_path?: string;
  created_at: string;
}

export interface SeoMetric {
  id: string;
  repository_id: string;
  metric_type: string;
  value: number;
  measured_at: string;
}

export interface SeoAnalysisResult {
  score: number;
  sections: Array<{
    name: string;
    issues: Array<{
      type: string;
      element?: string;
      issue?: string;
      suggestion?: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  }>;
  keywords: {
    current: string[];
    suggested: string[];
  };
} 