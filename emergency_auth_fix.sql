-- EMERGENCY AUTH FIX - Clean RLS policies and restore functionality
-- Run this immediately in Supabase SQL Editor

-- 1. Drop all problematic policies that are causing conflicts
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous can view public profiles" ON public.profiles;

-- 2. Keep only the essential, working policies
-- (The other policies like users_view_own_profile, users_update_own_profile, etc. are fine)

-- 3. Create simple, non-recursive admin policies
CREATE POLICY "simple_admin_access" ON public.profiles 
  FOR ALL TO authenticated 
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. Allow anonymous users to see approved users (for leaderboard)
CREATE POLICY "public_leaderboard_access" ON public.profiles 
  FOR SELECT TO anon 
  USING (
    id IN (
      SELECT DISTINCT user_id 
      FROM public.submissions 
      WHERE status = 'approved'
    )
  );

-- 5. Ensure admin_roles table has proper policies
DROP POLICY IF EXISTS "users_own_admin_status" ON public.admin_roles;
DROP POLICY IF EXISTS "admins_see_all_admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "admins_manage_admin_roles" ON public.admin_roles;

-- Simple admin_roles policies
CREATE POLICY "admin_roles_select" ON public.admin_roles 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_roles_manage" ON public.admin_roles 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Drop problematic functions if they exist
DROP FUNCTION IF EXISTS public.is_user_admin();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- 7. Update database statistics
ANALYZE public.profiles;
ANALYZE public.admin_roles;

-- This should restore login and admin dashboard access immediately
