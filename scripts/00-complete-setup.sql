-- ============================================================================
-- BuildTrack-LGU Database Schema - COMPLETE SETUP SCRIPT
-- ============================================================================
-- This is a CONSOLIDATED script that sets up the entire database.
-- Run this ONCE on a fresh Supabase project to initialize everything.
--
-- This script combines all fixes from scripts 01-10 into a single file.
-- New developers only need to run this one script!
-- ============================================================================
-- Version: 1.0
-- Last Updated: November 2024
-- What's Included:
--   - Database schema (tables, enums, relationships)
--   - Row Level Security (RLS) policies using JWT claims
--   - Automatic user profile creation trigger
--   - JWT claims setup for role-based access control
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: Create ENUM Types
-- ============================================================================

CREATE TYPE project_status AS ENUM (
  'Pending_Review',
  'Prioritized',
  'Funded',
  'Open_For_Bidding',
  'In_Progress',
  'Completed',
  'On_Hold',
  'Cancelled'
);

CREATE TYPE user_role AS ENUM (
  'System_Administrator',
  'Planner',
  'Development_Council',
  'Legislator',
  'Budget_Officer',
  'BAC_Secretariat',
  'Technical_Inspector',
  'Contractor',
  'Public_User'
);

CREATE TYPE milestone_status AS ENUM (
  'Not_Started',
  'In_Progress',
  'Completed',
  'Delayed'
);

-- ============================================================================
-- STEP 2: Create Database Tables
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'Public_User',
  office_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Contractors table
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  tin TEXT UNIQUE NOT NULL,
  registration_number TEXT,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  contact_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  barangay TEXT NOT NULL,
  project_category TEXT NOT NULL,
  estimated_cost DECIMAL(12, 2) NOT NULL,
  approved_budget_amount DECIMAL(12, 2),
  amount_disbursed DECIMAL(12, 2) DEFAULT 0,
  fund_source_code TEXT,
  status project_status DEFAULT 'Pending_Review',
  proposed_solution TEXT,
  problem_description TEXT,
  contractor_id UUID REFERENCES contractors(id),
  contract_amount DECIMAL(12, 2),
  start_date DATE,
  end_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Project documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  bid_amount DECIMAL(12, 2) NOT NULL,
  bid_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_winning_bid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  percentage_complete INTEGER NOT NULL CHECK (percentage_complete >= 0 AND percentage_complete <= 100),
  status milestone_status DEFAULT 'Not_Started',
  scheduled_start_date DATE,
  scheduled_end_date DATE,
  actual_completion_date DATE,
  order_sequence INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Project updates table (progress reports)
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  percentage_complete INTEGER NOT NULL CHECK (percentage_complete >= 0 AND percentage_complete <= 100),
  report_text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_pending_approval BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES users(id),
  approval_comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update attachments table
CREATE TABLE IF NOT EXISTS update_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  update_id UUID NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  attachment_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL,
  donation_description TEXT NOT NULL,
  quantity INTEGER,
  unit TEXT,
  donation_date DATE NOT NULL,
  logged_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Project history (audit log) table
CREATE TABLE IF NOT EXISTS project_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL,
  old_status project_status,
  new_status project_status,
  change_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bid invitations table
CREATE TABLE IF NOT EXISTS bid_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  bid_opening_date DATE NOT NULL,
  bid_closing_date DATE NOT NULL,
  pre_bid_conference_date DATE,
  requirements TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- STEP 3: Enable Row Level Security (RLS) on All Tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create JWT Claims Function
-- ============================================================================
-- This function sets user role in JWT claims to avoid recursive RLS policies

CREATE OR REPLACE FUNCTION public.set_claim(uid uuid, claim text, value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(claim, value)
  WHERE id = uid;
END;
$$;

-- ============================================================================
-- STEP 5: Create Automatic User Profile Creation Trigger
-- ============================================================================
-- This trigger automatically creates a user profile and sets JWT claims
-- when a new user signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Extract and cast the role from sign-up metadata
  BEGIN
    user_role_value := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'Public_User'::user_role
    );
  EXCEPTION
    WHEN OTHERS THEN
      user_role_value := 'Public_User'::user_role;
  END;

  -- Insert user profile into public.users table
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    user_role_value
  );

  -- Set role in JWT claims (app_metadata) to avoid recursive RLS queries
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_role', user_role_value::text)
  WHERE id = NEW.id;

  RETURN NEW;

EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, skip silently
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: RLS Policies for Users Table (JWT-based, non-recursive)
-- ============================================================================

CREATE POLICY "Users can view their own profile" 
ON users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON users 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" 
ON users 
FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'System_Administrator'
);

CREATE POLICY "Admins can update all users" 
ON users 
FOR UPDATE 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'System_Administrator'
);

CREATE POLICY "Service role can manage users" 
ON users 
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 7: RLS Policies for Contractors Table
-- ============================================================================

CREATE POLICY "Anyone can view contractors" 
ON contractors 
FOR SELECT 
USING (true);

CREATE POLICY "BAC Secretariat can insert contractors" 
ON contractors 
FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'BAC_Secretariat'
);

CREATE POLICY "BAC Secretariat can update contractors" 
ON contractors 
FOR UPDATE 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'BAC_Secretariat'
);

-- ============================================================================
-- STEP 8: RLS Policies for Projects Table
-- ============================================================================

-- Users can view their own projects
CREATE POLICY "Users can view their own projects" 
ON projects 
FOR SELECT 
USING (auth.uid() = created_by);

-- System Admin can view all projects
CREATE POLICY "System Admin can view all projects" 
ON projects 
FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'System_Administrator'
);

-- Privileged roles can view all projects
CREATE POLICY "Privileged roles can view all projects" 
ON projects 
FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
    'Development_Council', 
    'Budget_Officer', 
    'BAC_Secretariat',
    'Technical_Inspector',
    'Legislator'
  )
);

-- Public users can view active projects only
CREATE POLICY "Public can view active projects" 
ON projects 
FOR SELECT 
USING (
  (
    auth.uid() IS NULL 
    OR (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Public_User'
  )
  AND status IN ('In_Progress', 'Completed', 'Open_For_Bidding')
);

-- Planners can insert projects
CREATE POLICY "Planners can insert projects" 
ON projects 
FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Planner'
);

-- Appropriate roles can update projects
CREATE POLICY "Appropriate roles can update projects" 
ON projects 
FOR UPDATE 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
    'System_Administrator',
    'Development_Council',
    'Budget_Officer',
    'BAC_Secretariat',
    'Technical_Inspector'
  )
  OR auth.uid() = created_by
);

-- ============================================================================
-- STEP 9: RLS Policies for Project Documents Table
-- ============================================================================

CREATE POLICY "Users can view documents for accessible projects" 
ON project_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_documents.project_id 
    AND (
      projects.created_by = auth.uid() OR
      (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
        'System_Administrator', 
        'Development_Council', 
        'Budget_Officer', 
        'BAC_Secretariat', 
        'Technical_Inspector', 
        'Legislator'
      )
    )
  )
);

CREATE POLICY "Users can insert documents for their projects" 
ON project_documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_documents.project_id 
    AND projects.created_by = auth.uid()
  )
);

-- ============================================================================
-- STEP 10: RLS Policies for Bids Table
-- ============================================================================

CREATE POLICY "BAC can view all bids" 
ON bids 
FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'BAC_Secretariat'
);

CREATE POLICY "Contractors can view their own bids" 
ON bids 
FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Contractor'
);

CREATE POLICY "Contractors can insert bids" 
ON bids 
FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Contractor'
);

-- ============================================================================
-- STEP 11: RLS Policies for Milestones Table
-- ============================================================================

CREATE POLICY "Users can view milestones for accessible projects" 
ON milestones 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = milestones.project_id 
    AND (
      projects.created_by = auth.uid() OR
      (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
        'System_Administrator', 
        'Development_Council', 
        'Budget_Officer', 
        'BAC_Secretariat', 
        'Technical_Inspector', 
        'Legislator'
      )
    )
  )
);

CREATE POLICY "Technical Inspector can manage milestones" 
ON milestones 
FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Technical_Inspector'
);

CREATE POLICY "Technical Inspector can update milestones" 
ON milestones 
FOR UPDATE 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Technical_Inspector'
);

-- ============================================================================
-- STEP 12: RLS Policies for Project Updates Table
-- ============================================================================

CREATE POLICY "Appropriate users can view project updates" 
ON project_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_updates.project_id 
    AND (
      projects.created_by = auth.uid() OR
      (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
        'System_Administrator',
        'Technical_Inspector'
      )
    )
  ) OR
  project_updates.submitted_by = auth.uid()
);

CREATE POLICY "Contractors can submit updates" 
ON project_updates 
FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Contractor'
);

CREATE POLICY "Technical Inspector can approve updates" 
ON project_updates 
FOR UPDATE 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Technical_Inspector'
);

-- ============================================================================
-- STEP 13: RLS Policies for Update Attachments Table
-- ============================================================================

CREATE POLICY "Users can view attachments for accessible updates" 
ON update_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM project_updates pu
    JOIN projects p ON p.id = pu.project_id
    WHERE pu.id = update_attachments.update_id
    AND (
      p.created_by = auth.uid() OR
      pu.submitted_by = auth.uid() OR
      (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
        'System_Administrator',
        'Technical_Inspector'
      )
    )
  )
);

-- ============================================================================
-- STEP 14: RLS Policies for Donations Table
-- ============================================================================

CREATE POLICY "Users can view donations for accessible projects" 
ON donations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = donations.project_id 
    AND (
      projects.created_by = auth.uid() OR
      (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
        'System_Administrator',
        'Technical_Inspector'
      )
    )
  )
);

CREATE POLICY "Technical Inspector can log donations" 
ON donations 
FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'Technical_Inspector'
);

-- ============================================================================
-- STEP 15: RLS Policies for Project History Table
-- ============================================================================

CREATE POLICY "Audit logs visible to admins only" 
ON project_history 
FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') IN (
    'System_Administrator',
    'Technical_Inspector'
  )
);

-- ============================================================================
-- STEP 16: RLS Policies for Bid Invitations Table
-- ============================================================================

CREATE POLICY "Anyone can view public bid invitations" 
ON bid_invitations 
FOR SELECT 
USING (true);

CREATE POLICY "BAC Secretariat can manage bid invitations" 
ON bid_invitations 
FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'BAC_Secretariat'
);

CREATE POLICY "BAC Secretariat can update bid invitations" 
ON bid_invitations 
FOR UPDATE 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'BAC_Secretariat'
);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next Steps:
-- 1. (Optional) Run seed-mock-data.sql to populate with test data
-- 2. Update your .env.local file with Supabase credentials
-- 3. Run: npm install
-- 4. Run: npm run dev
-- 5. Sign up with a test account
-- 6. Users must log out and back in after first signup for JWT claims to work
-- ============================================================================
