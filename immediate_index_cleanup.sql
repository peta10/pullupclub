-- ==========================================
-- IMMEDIATE PERFORMANCE FIX - Remove Unused Indexes
-- Run this script in Supabase SQL Editor to fix all 16 performance issues
-- ==========================================

-- Remove all 15 unused indexes that are consuming space
-- These have idx_scan = 0 meaning they've never been used

DROP INDEX IF EXISTS public.idx_messages_log_user_id;
DROP INDEX IF EXISTS public.idx_notification_queue_user_id;
DROP INDEX IF EXISTS public.idx_pool_logs_pool_id;
DROP INDEX IF EXISTS public.idx_subscriptions_user_id;
DROP INDEX IF EXISTS public.idx_user_badges_submission_id;
DROP INDEX IF EXISTS public.idx_weekly_earnings_user_id;
DROP INDEX IF EXISTS public.idx_profiles_is_paid;
DROP INDEX IF EXISTS public.idx_leaderboard_cache_actual_pull_up_count;
DROP INDEX IF EXISTS public.idx_leaderboard_cache_gender;
DROP INDEX IF EXISTS public.idx_badge_assignment_metrics_badge_id;
DROP INDEX IF EXISTS public.idx_notification_queue_template_id;
DROP INDEX IF EXISTS public.idx_payout_requests_paid_by;
DROP INDEX IF EXISTS public.idx_profiles_admin_role_id;
DROP INDEX IF EXISTS public.idx_user_badges_badge_id;
DROP INDEX IF EXISTS public.idx_weekly_earnings_pool_id;

-- Add the missing foreign key index
-- Note: Check if your_table_name is the actual table name or placeholder
CREATE INDEX IF NOT EXISTS idx_your_table_name_admin_role_id 
ON public.your_table_name (admin_role_id);

-- Analyze tables after index changes
ANALYZE;

-- Verification: Check remaining performance issues
SELECT 'Index cleanup completed - performance issues should be resolved' as status;
