-- IMMEDIATE FIX - Run this in Supabase SQL Editor NOW
-- This fixes the authentication and 500 errors immediately

-- 1. Drop ALL problematic policies causing conflicts
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous can view public profiles" ON public.profiles;

-- 2. Drop problematic functions
DROP FUNCTION IF EXISTS public.is_user_admin();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- 3. Create ONE simple, working admin policy that replaces all the broken ones
CREATE POLICY "unified_profile_access" ON public.profiles 
  FOR ALL TO authenticated 
  USING (
    -- Users can access their own profile OR user is an admin
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. Allow public access for leaderboard (anonymous users)
CREATE POLICY "public_leaderboard_view" ON public.profiles 
  FOR SELECT TO anon 
  USING (
    id IN (
      SELECT DISTINCT user_id 
      FROM public.submissions 
      WHERE status = 'approved'
    )
  );

-- 5. Fix admin_roles policies
DROP POLICY IF EXISTS "users_own_admin_status" ON public.admin_roles;
DROP POLICY IF EXISTS "admins_see_all_admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "admins_manage_admin_roles" ON public.admin_roles;

CREATE POLICY "admin_roles_access" ON public.admin_roles 
  FOR ALL TO authenticated 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Refresh statistics
ANALYZE public.profiles;
ANALYZE public.admin_roles;

-- THIS SHOULD IMMEDIATELY FIX LOGIN AND ADMIN DASHBOARD ACCESS
