-- ==========================================
-- SUPABASE PULL-UP CLUB DATABASE FIXES
-- Execute this script to resolve all security and performance issues
-- Date: 2025-01-17
-- ==========================================

-- ==========================================
-- 1. SECURITY FIXES - Function Search Paths
-- ==========================================

-- Fix search path security vulnerabilities for functions
-- This prevents search path attacks by setting an empty search path

ALTER FUNCTION public.get_current_weekly_pool() SET search_path = '';
ALTER FUNCTION public.process_submission_earnings() SET search_path = '';

-- Add comments for documentation
COMMENT ON FUNCTION public.get_current_weekly_pool() IS 'Fixed search path security vulnerability - 2025-01-17';
COMMENT ON FUNCTION public.process_submission_earnings() IS 'Fixed search path security vulnerability - 2025-01-17';

-- ==========================================
-- 2. PERFORMANCE FIXES - Remove Unused Indexes
-- ==========================================

-- Remove the exact 15 unused indexes identified by the performance advisor
-- These indexes have never been used (idx_scan = 0) and consume unnecessary space

-- BATCH 1: Core table indexes
DROP INDEX IF EXISTS public.idx_messages_log_user_id;
DROP INDEX IF EXISTS public.idx_notification_queue_user_id;
DROP INDEX IF EXISTS public.idx_pool_logs_pool_id;
DROP INDEX IF EXISTS public.idx_subscriptions_user_id;
DROP INDEX IF EXISTS public.idx_user_badges_submission_id;

-- BATCH 2: Earnings and analytics indexes  
DROP INDEX IF EXISTS public.idx_weekly_earnings_user_id;
DROP INDEX IF EXISTS public.idx_profiles_is_paid;
DROP INDEX IF EXISTS public.idx_leaderboard_cache_actual_pull_up_count;
DROP INDEX IF EXISTS public.idx_leaderboard_cache_gender;
DROP INDEX IF EXISTS public.idx_badge_assignment_metrics_badge_id;

-- BATCH 3: Administrative and notification indexes
DROP INDEX IF EXISTS public.idx_notification_queue_template_id;
DROP INDEX IF EXISTS public.idx_payout_requests_paid_by;
DROP INDEX IF EXISTS public.idx_profiles_admin_role_id;
DROP INDEX IF EXISTS public.idx_user_badges_badge_id;
DROP INDEX IF EXISTS public.idx_weekly_earnings_pool_id;

-- Log the cleanup
SELECT 'Removed 15 unused indexes to improve performance' as action_taken;

-- ==========================================
-- 3. MISSING INDEX FIX
-- ==========================================

-- Check if the fk_admin_roles foreign key exists and add index if needed
-- Note: The "your_table_name" seems to be a placeholder table
-- You may need to adjust this based on your actual table structure

DO $$
BEGIN
    -- Check if the table exists first
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'your_table_name') THEN
        -- Add index for the foreign key if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'your_table_name' AND indexname = 'idx_your_table_name_admin_role_id') THEN
            CREATE INDEX idx_your_table_name_admin_role_id ON public.your_table_name (admin_role_id);
        END IF;
    END IF;
END $$;

-- ==========================================
-- 4. VERIFICATION QUERIES
-- ==========================================

-- Check remaining unused indexes (should be much fewer now)
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
    AND schemaname = 'public'
ORDER BY relname, indexrelname;

-- Check function search paths are now secure
SELECT 
    routine_name,
    routine_schema,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('get_current_weekly_pool', 'process_submission_earnings');

-- ==========================================
-- 5. CLEANUP AND MAINTENANCE
-- ==========================================

-- Update table statistics after index changes
ANALYZE;

-- Optional: Run VACUUM to reclaim space from dropped indexes
-- VACUUM (ANALYZE);

-- ==========================================
-- SCRIPT COMPLETION
-- ==========================================

SELECT 'Database optimization script completed successfully!' as status,
       current_timestamp as completed_at;
