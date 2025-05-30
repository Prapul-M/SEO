-- Create SEO issues table
CREATE TABLE IF NOT EXISTS seo_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    fixed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seo_issues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view issues for their projects"
    ON seo_issues FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = seo_issues.project_id
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can update issues for their projects"
    ON seo_issues FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = seo_issues.project_id
        AND p.user_id = auth.uid()
    ));

-- Create function to mark issue as fixed
CREATE OR REPLACE FUNCTION mark_issue_fixed(p_issue_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE seo_issues
    SET fixed = TRUE,
        updated_at = NOW()
    WHERE id = p_issue_id
    AND EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = seo_issues.project_id
        AND p.user_id = p_user_id
    );
END;
$$;

-- Create function to generate sample issues for a project
CREATE OR REPLACE FUNCTION generate_sample_issues(p_project_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Clear existing issues
    DELETE FROM seo_issues WHERE project_id = p_project_id;
    
    -- Insert sample high priority issues
    INSERT INTO seo_issues (project_id, page_url, severity, type, description, suggestion)
    VALUES
    (p_project_id, '/index.html', 'high', 'Meta Description', 
     'Meta description is missing or too short', 
     'Add a descriptive meta description between 120-155 characters'),
    (p_project_id, '/about.html', 'high', 'Title Tag', 
     'Title tag is not optimized for keywords', 
     'Include primary keywords in the title while keeping it under 60 characters');

    -- Insert sample medium priority issues
    INSERT INTO seo_issues (project_id, page_url, severity, type, description, suggestion)
    VALUES
    (p_project_id, '/services.html', 'medium', 'Header Tags', 
     'Page lacks proper header hierarchy', 
     'Implement proper H1-H6 structure with keywords in important headings'),
    (p_project_id, '/blog/post-1.html', 'medium', 'Image Alt Text', 
     'Multiple images missing alt text', 
     'Add descriptive alt text to all images for better accessibility and SEO');

    -- Insert sample low priority issues
    INSERT INTO seo_issues (project_id, page_url, severity, type, description, suggestion)
    VALUES
    (p_project_id, '/contact.html', 'low', 'URL Structure', 
     'URL could be more descriptive', 
     'Consider using more descriptive URLs with relevant keywords'),
    (p_project_id, '/products/category.html', 'low', 'Internal Links', 
     'Some internal links use generic anchor text', 
     'Use more descriptive anchor text for internal links');
END;
$$;

-- Modify start_seo_scan function to generate sample issues
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

    -- Generate sample issues
    PERFORM generate_sample_issues(p_project_id);

    -- Update project with mock scan results
    UPDATE projects
    SET scanning = FALSE,
        last_scan_at = NOW(),
        seo_score = floor(random() * (100-60 + 1) + 60)::integer
    WHERE id = p_project_id AND user_id = p_user_id;
END;
$$; 