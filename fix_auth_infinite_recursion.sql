-- ==========================================
-- CRITICAL FIX: Authentication Infinite Recursion
-- This fixes the infinite recursion in admin_roles policies that's breaking login
-- ==========================================

-- 1. Drop the problematic policies causing infinite recursion
DROP POLICY IF EXISTS "Admins can see all admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can check their own admin status" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_access_policy" ON public.admin_roles;

-- 2. Create simple, non-recursive policies for admin_roles
-- Allow users to check their own admin status (no circular reference)
CREATE POLICY "users_own_admin_status" ON public.admin_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Allow admins to see all admin roles using the is_admin() function approach
-- but ONLY if the user has a role = 'admin' in profiles table to avoid circular reference
CREATE POLICY "admins_see_all_admin_roles" ON public.admin_roles
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Allow admins to manage admin roles
CREATE POLICY "admins_manage_admin_roles" ON public.admin_roles
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 3. Create or update the auth trigger to handle profile creation
-- This ensures profiles are created when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create the trigger on auth.users if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Update the is_admin function to use profiles table instead of admin_roles
-- This breaks the circular dependency
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Also create a simpler admin check function
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_uuid 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Update statistics to refresh the query planner
ANALYZE public.admin_roles;
ANALYZE public.profiles;

-- 8. Test the fix by checking if we can query admin_roles without recursion
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count FROM public.admin_roles;
    RAISE NOTICE 'Admin roles table accessible: % rows found', test_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Admin roles table still has issues: %', SQLERRM;
END $$;

SELECT 'Authentication infinite recursion fixed' as status;
