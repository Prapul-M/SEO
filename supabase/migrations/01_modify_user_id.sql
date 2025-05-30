-- Drop existing foreign key constraints and policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Modify the user_id column in projects table
ALTER TABLE projects 
  DROP CONSTRAINT projects_user_id_fkey,
  ALTER COLUMN user_id TYPE TEXT;

-- Modify the user_id column in user_preferences table
ALTER TABLE user_preferences
  DROP CONSTRAINT user_preferences_user_id_fkey,
  ALTER COLUMN user_id TYPE TEXT;

-- Recreate the policies with TEXT type
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.jwt()->>'sub' = user_id::text);

CREATE POLICY "Users can insert their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.jwt()->>'sub' = user_id::text);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.jwt()->>'sub' = user_id::text);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.jwt()->>'sub' = user_id::text);

-- Update user preferences policies
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.jwt()->>'sub' = user_id::text);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.jwt()->>'sub' = user_id::text);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.jwt()->>'sub' = user_id::text); 