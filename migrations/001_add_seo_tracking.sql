-- Add automation_enabled column to repositories table
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT false;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMPTZ;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS seo_score INTEGER;

-- Create table for SEO scans
CREATE TABLE IF NOT EXISTS seo_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    issues_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending'
);

-- Create table for SEO issues
CREATE TABLE IF NOT EXISTS seo_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES seo_scans(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
    element TEXT,
    suggestion TEXT,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for SEO metrics
CREATE TABLE IF NOT EXISTS seo_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_seo_scans_repository_id ON seo_scans(repository_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_scan_id ON seo_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_seo_metrics_repository_id ON seo_metrics(repository_id);

-- Add function to update repository score
CREATE OR REPLACE FUNCTION update_repository_seo_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repositories
    SET seo_score = NEW.score,
        last_scan_at = NEW.completed_at
    WHERE id = NEW.repository_id
    AND NEW.status = 'completed';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update repository score
DROP TRIGGER IF EXISTS update_repo_score_trigger ON seo_scans;
CREATE TRIGGER update_repo_score_trigger
    AFTER INSERT OR UPDATE
    ON seo_scans
    FOR EACH ROW
    EXECUTE FUNCTION update_repository_seo_score(); 