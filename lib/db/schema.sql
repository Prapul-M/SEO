-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    automation_enabled BOOLEAN DEFAULT false,
    automation_schedule TIME NOT NULL DEFAULT '02:00:00',
    email_frequency TEXT DEFAULT 'weekly',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO automation logs table
CREATE TABLE IF NOT EXISTS seo_automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    repository_id UUID REFERENCES repositories(id),
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    changes_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO changes table
CREATE TABLE IF NOT EXISTS seo_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_log_id UUID REFERENCES seo_automation_logs(id),
    file_path TEXT NOT NULL,
    element_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    confidence_score FLOAT,
    status TEXT DEFAULT 'pending',
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO performance metrics table
CREATE TABLE IF NOT EXISTS seo_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id),
    url TEXT NOT NULL,
    clicks INTEGER,
    impressions INTEGER,
    average_position FLOAT,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_seo_automation_logs_user_id ON seo_automation_logs(user_id);
CREATE INDEX idx_seo_automation_logs_repository_id ON seo_automation_logs(repository_id);
CREATE INDEX idx_seo_changes_automation_log_id ON seo_changes(automation_log_id);
CREATE INDEX idx_seo_performance_metrics_repository_id ON seo_performance_metrics(repository_id);
CREATE INDEX idx_seo_performance_metrics_date ON seo_performance_metrics(date);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 