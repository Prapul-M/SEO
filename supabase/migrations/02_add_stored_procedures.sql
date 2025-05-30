-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_user_projects(p_user_id TEXT);
DROP FUNCTION IF EXISTS public.delete_user_project(UUID, TEXT);
DROP FUNCTION IF EXISTS public.toggle_project_automation(UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_user_preferences(TEXT);
DROP FUNCTION IF EXISTS public.update_user_preferences(TEXT, TEXT, TEXT, BOOLEAN);

-- Function to get user projects with their scans
CREATE OR REPLACE FUNCTION public.get_user_projects(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner TEXT,
    user_id TEXT,
    default_branch TEXT,
    created_at TIMESTAMPTZ,
    automation_enabled BOOLEAN,
    last_scan_at TIMESTAMPTZ,
    seo_score INTEGER,
    scan_history JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.owner,
        p.user_id,
        p.default_branch,
        p.created_at,
        p.automation_enabled,
        p.last_scan_at,
        p.seo_score,
        COALESCE(
            (
                SELECT json_agg(json_build_object(
                    'date', s.created_at,
                    'score', s.score
                ) ORDER BY s.created_at DESC)
                FROM (
                    SELECT created_at, score
                    FROM seo_scans
                    WHERE project_id = p.id
                    ORDER BY created_at DESC
                    LIMIT 10
                ) s
            ),
            '[]'::json
        ) as scan_history
    FROM projects p
    WHERE p.user_id = p_user_id
    ORDER BY p.created_at DESC;
END;
$$;

-- Function to delete a user's project
CREATE OR REPLACE FUNCTION public.delete_user_project(p_project_id UUID, p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    DELETE FROM projects
    WHERE id = p_project_id AND user_id = p_user_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;

-- Function to toggle project automation
CREATE OR REPLACE FUNCTION public.toggle_project_automation(p_project_id UUID, p_user_id TEXT, p_enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE projects
    SET 
        automation_enabled = p_enabled,
        last_scan_at = CASE WHEN p_enabled THEN NOW() ELSE last_scan_at END
    WHERE id = p_project_id AND user_id = p_user_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION public.get_user_preferences(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    timezone TEXT,
    automation_schedule TEXT,
    email_notifications BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM user_preferences
    WHERE user_id = p_user_id;
END;
$$;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION public.update_user_preferences(
    p_user_id TEXT,
    p_timezone TEXT,
    p_automation_schedule TEXT,
    p_email_notifications BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    INSERT INTO user_preferences (
        user_id,
        timezone,
        automation_schedule,
        email_notifications,
        updated_at
    )
    VALUES (
        p_user_id,
        p_timezone,
        p_automation_schedule,
        p_email_notifications,
        NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        timezone = EXCLUDED.timezone,
        automation_schedule = EXCLUDED.automation_schedule,
        email_notifications = EXCLUDED.email_notifications,
        updated_at = NOW();
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_projects(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_project(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_project_automation(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferences(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_preferences(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Grant table permissions to authenticated users
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.seo_scans TO authenticated; 