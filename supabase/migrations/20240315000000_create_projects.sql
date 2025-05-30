-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    repo TEXT NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_scan_at TIMESTAMPTZ,
    scanning BOOLEAN NOT NULL DEFAULT FALSE,
    seo_score INTEGER,
    automation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, owner, repo)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to get user projects
CREATE OR REPLACE FUNCTION get_user_projects(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner TEXT,
    repo TEXT,
    default_branch TEXT,
    created_at TIMESTAMPTZ,
    last_scan_at TIMESTAMPTZ,
    scanning BOOLEAN,
    seo_score INTEGER,
    automation_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id,
           p.name,
           p.owner,
           p.repo,
           p.default_branch,
           p.created_at,
           p.last_scan_at,
           p.scanning,
           p.seo_score,
           p.automation_enabled
    FROM projects p
    WHERE p.user_id = p_user_id
    ORDER BY p.created_at DESC;
END;
$$;

-- Create function to delete user project
CREATE OR REPLACE FUNCTION delete_user_project(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM projects
    WHERE id = p_project_id AND user_id = p_user_id;
END;
$$;

-- Create function to toggle project automation
CREATE OR REPLACE FUNCTION toggle_project_automation(p_project_id UUID, p_user_id UUID, p_enabled BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE projects
    SET automation_enabled = p_enabled
    WHERE id = p_project_id AND user_id = p_user_id;
END;
$$;

-- Create function to start SEO scan
CREATE OR REPLACE FUNCTION start_seo_scan(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update project status to scanning
    UPDATE projects
    SET scanning = TRUE
    WHERE id = p_project_id AND user_id = p_user_id;

    -- For demo purposes, we'll update the project after a short delay
    -- In a real application, this would be handled by a background worker
    PERFORM pg_sleep(5);

    -- Update project with mock scan results
    UPDATE projects
    SET scanning = FALSE,
        last_scan_at = NOW(),
        seo_score = floor(random() * (100-60 + 1) + 60)::integer
    WHERE id = p_project_id AND user_id = p_user_id;
END;
$$; 