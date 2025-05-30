-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    user_id TEXT NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    automation_enabled BOOLEAN DEFAULT false,
    last_scan_at TIMESTAMPTZ,
    seo_score INTEGER
);

-- Create the seo_scans table
CREATE TABLE IF NOT EXISTS public.seo_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER NOT NULL,
    issues_found INTEGER DEFAULT 0,
    scan_details JSONB
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    timezone TEXT DEFAULT 'UTC',
    automation_schedule TEXT DEFAULT '0 0 * * *',
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_scans_project_id ON public.seo_scans(project_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Set up RLS policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.projects FOR DELETE
    USING (auth.uid()::text = user_id);

-- SEO Scans policies
CREATE POLICY "Users can view scans of their projects"
    ON public.seo_scans FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = seo_scans.project_id
        AND projects.user_id = auth.uid()::text
    ));

CREATE POLICY "Users can insert scans for their projects"
    ON public.seo_scans FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = seo_scans.project_id
        AND projects.user_id = auth.uid()::text
    ));

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Grant permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.seo_scans TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated; 