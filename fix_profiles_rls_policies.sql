-- ==========================================
-- FIX PROFILES RLS POLICIES
-- Remove any remaining circular references in profiles policies
-- ==========================================

-- Drop and recreate profiles policies to remove admin_roles circular references
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.profiles;

-- Recreate cleaner policies without circular references
-- 1. Users can always view their own profile
CREATE POLICY "users_view_own_profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "users_update_own_profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- 3. Admins can view all profiles (using role column directly)
CREATE POLICY "admins_view_all_profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
    auth.uid() = id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
    OR
    id IN (
        SELECT DISTINCT submissions.user_id
        FROM submissions
        WHERE submissions.status = 'approved'
    )
);

-- 4. Admins can update all profiles
CREATE POLICY "admins_update_all_profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
    auth.uid() = id 
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 5. Admins can delete profiles
CREATE POLICY "admins_delete_profiles" ON public.profiles
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 6. Keep the anonymous policy for public profiles
-- (This was already fine)

-- 7. Ensure insert policy allows users to create their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

SELECT 'Profiles RLS policies fixed' as status;
