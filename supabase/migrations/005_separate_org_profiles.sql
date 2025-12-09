-- Migration: Separate Organization Profiles from Individual Profiles
-- This creates a dedicated table for organization account profiles

-- ============================================
-- ORGANIZATION PROFILES TABLE
-- ============================================
-- This table stores profile information for users who signed up as organizations
-- It mirrors the profiles table structure but is specifically for organization accounts

CREATE TABLE IF NOT EXISTS organization_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  organization_name TEXT,
  organization_type organization_type DEFAULT 'other',
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  location JSONB,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ne')),
  is_verified BOOLEAN DEFAULT false,
  verification_status org_verification_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for organization_profiles
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization profiles are viewable by everyone"
  ON organization_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own organization profile"
  ON organization_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own organization profile"
  ON organization_profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_profiles_email ON organization_profiles(email);
CREATE INDEX IF NOT EXISTS idx_organization_profiles_org_type ON organization_profiles(organization_type);

-- ============================================
-- UPDATE EXISTING ACCOUNTS
-- ============================================
-- All existing accounts in profiles table remain as individual accounts
-- Set their role to 'user' or 'individual' if not already set

UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL OR role = 'individual';

-- Note: Organization accounts created AFTER this migration will be stored in organization_profiles
-- Existing organization role users in profiles table can be migrated manually if needed

-- ============================================
-- FUNCTION: Get account type by user ID
-- ============================================
CREATE OR REPLACE FUNCTION get_account_type(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  account_type TEXT;
BEGIN
  -- Check if user exists in organization_profiles
  IF EXISTS (SELECT 1 FROM organization_profiles WHERE id = user_id) THEN
    RETURN 'organization';
  END IF;
  
  -- Check if user exists in profiles (individual)
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RETURN 'individual';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
