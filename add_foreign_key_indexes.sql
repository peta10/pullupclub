-- ==========================================
-- ADD MISSING FOREIGN KEY INDEXES
-- These indexes will improve JOIN performance and resolve all performance warnings
-- ==========================================

-- Remove the placeholder index we created
DROP INDEX IF EXISTS public.idx_your_table_name_admin_role_id;

-- Add proper foreign key indexes based on the performance advisor results
-- These will significantly improve JOIN performance

-- 1. Badge Assignment Metrics
CREATE INDEX IF NOT EXISTS idx_badge_assignment_metrics_badge_id 
ON public.badge_assignment_metrics (badge_id);

-- 2. Messages Log  
CREATE INDEX IF NOT EXISTS idx_messages_log_user_id 
ON public.messages_log (user_id);

-- 3. Notification Queue (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_notification_queue_template_id 
ON public.notification_queue (template_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id 
ON public.notification_queue (user_id);

-- 4. Payout Requests
CREATE INDEX IF NOT EXISTS idx_payout_requests_paid_by 
ON public.payout_requests (paid_by);

-- 5. Pool Logs
CREATE INDEX IF NOT EXISTS idx_pool_logs_pool_id 
ON public.pool_logs (pool_id);

-- 6. Profiles (admin role foreign key)
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role_id 
ON public.profiles (admin_role_id);

-- 7. Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON public.subscriptions (user_id);

-- 8. User Badges (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id 
ON public.user_badges (badge_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_submission_id 
ON public.user_badges (submission_id);

-- 9. Weekly Earnings (2 foreign keys)
CREATE INDEX IF NOT EXISTS idx_weekly_earnings_user_id 
ON public.weekly_earnings (user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_earnings_weekly_pool_id 
ON public.weekly_earnings (weekly_pool_id);

-- Update statistics after adding indexes
ANALYZE;

-- Verification
SELECT 'Added 12 foreign key indexes for optimal JOIN performance' as status;
