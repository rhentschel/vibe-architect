-- Project members table for guest access
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'guest')) DEFAULT 'guest',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Index for faster lookups
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Project members policies
CREATE POLICY "Users can view project members of projects they belong to"
  ON project_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Update projects policies to include guests
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects or projects they are members of"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Update messages policies to include guests
DROP POLICY IF EXISTS "Users can view messages of own projects" ON messages;
CREATE POLICY "Users can view messages of own or member projects"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can create messages in own projects" ON messages;
CREATE POLICY "Users can create messages in own or member projects"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = messages.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

-- Update snapshots policies to include guests
DROP POLICY IF EXISTS "Users can view snapshots of own projects" ON architecture_snapshots;
CREATE POLICY "Users can view snapshots of own or member projects"
  ON architecture_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = architecture_snapshots.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can create snapshots in own projects" ON architecture_snapshots;
CREATE POLICY "Users can create snapshots in own or member projects"
  ON architecture_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = architecture_snapshots.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members
          WHERE project_members.project_id = projects.id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );
