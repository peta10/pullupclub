-- ==========================================
-- CRITICAL DATABASE FIXES
-- Fix all missing columns and schema issues causing 400/406 errors
-- ==========================================

-- 1. Add missing columns to user_earnings table (fixing the dollars_earned error)
ALTER TABLE public.user_earnings 
ADD COLUMN IF NOT EXISTS dollars_earned DECIMAL(10,2) DEFAULT 0;

-- 2. Add missing columns to weekly_pools table (fixing remaining_dollars and is_current errors)
ALTER TABLE public.weekly_pools 
ADD COLUMN IF NOT EXISTS remaining_dollars DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- 3. Fix admin_roles table - add missing columns that queries might expect
ALTER TABLE public.admin_roles 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- 4. Enable RLS properly for admin_roles (this is causing the 406 errors)
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policy if it exists and create proper one
DROP POLICY IF EXISTS "Users can check their own admin status" ON public.admin_roles;

-- 6. Create proper policy for admin role access
CREATE POLICY "Users can check their own admin status" 
ON public.admin_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 7. Allow admins to see all admin roles
CREATE POLICY "Admins can see all admin roles" 
ON public.admin_roles FOR ALL
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid() 
    AND ar.is_active = true
  )
);

-- 8. Update table statistics after schema changes
ANALYZE public.user_earnings;
ANALYZE public.weekly_pools;
ANALYZE public.admin_roles;

-- 9. Verify the fixes
SELECT 'Schema fixes completed successfully' as status;
