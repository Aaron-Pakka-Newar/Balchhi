-- Migration: Fix profile trigger to use 'individual' instead of 'user' as default
-- Also update to handle phone field from user_metadata

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create updated function that uses 'individual' as default role and handles phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'individual'),  -- Changed from 'user' to 'individual'
    NEW.raw_user_meta_data->>'phone'  -- Handle phone from user_metadata
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update any existing profiles with 'user' role to 'individual' if they are not special roles
-- This preserves 'organization', 'admin', and 'verified_user' roles
UPDATE profiles 
SET role = 'individual' 
WHERE role = 'user';
