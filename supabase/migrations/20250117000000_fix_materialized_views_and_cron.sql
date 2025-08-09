-- Fix materialized views and cron jobs for production readiness
-- This migration recreates leaderboard_cache and badge_statistics as proper materialized views
-- and sets up the necessary cron jobs for automatic refresh

-- Drop existing views/tables if they exist
DROP VIEW IF EXISTS public.leaderboard_cache CASCADE;
DROP TABLE IF EXISTS public.leaderboard_cache CASCADE;
DROP VIEW IF EXISTS public.badge_statistics CASCADE;
DROP TABLE IF EXISTS public.badge_statistics CASCADE;

-- Create leaderboard_cache as a MATERIALIZED VIEW
CREATE MATERIALIZED VIEW public.leaderboard_cache AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.gender,
    p.organization,
    p.city,
    p.state,
    p.country,
    p.social_media,
    p.role,
    COALESCE(s.best_pull_ups, 0) as best_pull_ups,
    COALESCE(s.total_submissions, 0) as total_submissions,
    COALESCE(s.approved_submissions, 0) as approved_submissions,
    COALESCE(ue.total_earnings, 0.00) as total_earnings,
    COALESCE(ue.total_payout_requests, 0.00) as total_payout_requests,
    COALESCE(ue.pending_payout, 0.00) as pending_payout,
    s.last_submission_date,
    s.last_approved_date,
    CASE 
        WHEN p.gender = 'female' THEN
            CASE 
                WHEN COALESCE(s.best_pull_ups, 0) >= 20 THEN 'Elite'
                WHEN COALESCE(s.best_pull_ups, 0) >= 15 THEN 'Hardened'
                WHEN COALESCE(s.best_pull_ups, 0) >= 10 THEN 'Operator'
                WHEN COALESCE(s.best_pull_ups, 0) >= 5 THEN 'Proven'
                WHEN COALESCE(s.best_pull_ups, 0) >= 1 THEN 'Recruit'
                ELSE 'Unranked'
            END
        ELSE
            CASE 
                WHEN COALESCE(s.best_pull_ups, 0) >= 30 THEN 'Elite'
                WHEN COALESCE(s.best_pull_ups, 0) >= 25 THEN 'Hardened'
                WHEN COALESCE(s.best_pull_ups, 0) >= 20 THEN 'Operator'
                WHEN COALESCE(s.best_pull_ups, 0) >= 15 THEN 'Proven'
                WHEN COALESCE(s.best_pull_ups, 0) >= 10 THEN 'Recruit'
                ELSE 'Unranked'
            END
    END as badge_level,
    NOW() as last_updated
FROM profiles p
LEFT JOIN (
    SELECT 
        user_id,
        MAX(actual_pull_up_count) as best_pull_ups,
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_submissions,
        MAX(created_at) as last_submission_date,
        MAX(CASE WHEN status = 'approved' THEN created_at END) as last_approved_date
    FROM submissions
    GROUP BY user_id
) s ON p.id = s.user_id
LEFT JOIN (
    SELECT 
        ue.user_id,
        SUM(ue.dollars_earned) as total_earnings,
        COALESCE(pr.total_requested, 0) as total_payout_requests,
        COALESCE(pr.pending_amount, 0) as pending_payout
    FROM user_earnings ue
    LEFT JOIN (
        SELECT 
            user_id,
            SUM(amount_dollars) as total_requested,
            SUM(CASE WHEN status = 'pending' THEN amount_dollars ELSE 0 END) as pending_amount
        FROM payout_requests
        GROUP BY user_id
    ) pr ON ue.user_id = pr.user_id
    GROUP BY ue.user_id, pr.total_requested, pr.pending_amount
) ue ON p.id = ue.user_id
WHERE p.is_paid = true;

-- Create index for performance
CREATE INDEX idx_leaderboard_cache_best_pull_ups ON public.leaderboard_cache(best_pull_ups DESC);
CREATE INDEX idx_leaderboard_cache_badge_level ON public.leaderboard_cache(badge_level);
CREATE INDEX idx_leaderboard_cache_gender ON public.leaderboard_cache(gender);

-- Create badge_statistics as a MATERIALIZED VIEW
CREATE MATERIALIZED VIEW public.badge_statistics AS
SELECT 
    badge_level,
    gender,
    COUNT(*) as user_count,
    AVG(best_pull_ups) as avg_pull_ups,
    MAX(best_pull_ups) as max_pull_ups,
    MIN(best_pull_ups) as min_pull_ups,
    SUM(total_earnings) as total_earnings,
    NOW() as last_updated
FROM public.leaderboard_cache
WHERE badge_level != 'Unranked'
GROUP BY badge_level, gender;

-- Create indexes for badge_statistics
CREATE INDEX idx_badge_statistics_level ON public.badge_statistics(badge_level);
CREATE INDEX idx_badge_statistics_gender ON public.badge_statistics(gender);

-- Grant public SELECT access to both materialized views (everyone can see the leaderboard)
GRANT SELECT ON public.leaderboard_cache TO anon, authenticated;
GRANT SELECT ON public.badge_statistics TO anon, authenticated;

-- Create refresh functions for the materialized views
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_cache;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.badge_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron jobs for automatic refresh
-- Note: These need to be created in the cron schema after migration is applied
-- The actual cron job creation will be done via Supabase dashboard or separate function

-- Create a function to set up all cron jobs
CREATE OR REPLACE FUNCTION setup_cron_jobs()
RETURNS void AS $$
BEGIN
    -- Remove existing jobs if they exist
    DELETE FROM cron.job WHERE jobname IN (
        'refresh-leaderboard-cache',
        'reset-weekly-pool',
        'process-email-queue',
        'send-paypal-reminders'
    );
    
    -- Refresh leaderboard cache every 15 minutes
    INSERT INTO cron.job (schedule, command, nodename, nodeport, database, username, jobname)
    VALUES (
        '*/15 * * * *',
        'SELECT refresh_leaderboard_cache();',
        'localhost',
        5432,
        current_database(),
        current_user,
        'refresh-leaderboard-cache'
    );
    
    -- Reset weekly pool every Monday at midnight UTC
    INSERT INTO cron.job (schedule, command, nodename, nodeport, database, username, jobname)
    VALUES (
        '0 0 * * 1',
        'SELECT reset_weekly_pool();',
        'localhost',
        5432,
        current_database(),
        current_user,
        'reset-weekly-pool'
    );
    
    -- Process email queue every 5 minutes
    INSERT INTO cron.job (schedule, command, nodename, nodeport, database, username, jobname)
    VALUES (
        '*/5 * * * *',
        'SELECT net.http_post(
            url := ''https://yqnikgupiaghgjtsaypr.supabase.co/functions/v1/process-email-queue'',
            headers := jsonb_build_object(
                ''Authorization'', ''Bearer '' || current_setting(''supabase.service_role_key''),
                ''Content-Type'', ''application/json''
            ),
            body := jsonb_build_object(''trigger'', ''cron'')
        );',
        'localhost',
        5432,
        current_database(),
        current_user,
        'process-email-queue'
    );
    
    -- Send PayPal reminders on the 1st of each month at 9 AM UTC
    INSERT INTO cron.job (schedule, command, nodename, nodeport, database, username, jobname)
    VALUES (
        '0 9 1 * *',
        'SELECT net.http_post(
            url := ''https://yqnikgupiaghgjtsaypr.supabase.co/functions/v1/send-paypal-reminders-branded'',
            headers := jsonb_build_object(
                ''Authorization'', ''Bearer '' || current_setting(''supabase.service_role_key''),
                ''Content-Type'', ''application/json''
            ),
            body := jsonb_build_object(''trigger'', ''cron'')
        );',
        'localhost',
        5432,
        current_database(),
        current_user,
        'send-paypal-reminders'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset weekly pool (creates new pool each week)
CREATE OR REPLACE FUNCTION reset_weekly_pool()
RETURNS void AS $$
DECLARE
    v_new_pool_id UUID;
BEGIN
    -- Mark current pool as not current
    UPDATE weekly_pools 
    SET is_current = false 
    WHERE is_current = true;
    
    -- Create new weekly pool with $250 budget
    INSERT INTO weekly_pools (
        total_dollars,
        remaining_dollars,
        spent_dollars,
        is_current,
        is_depleted,
        week_start,
        week_end
    ) VALUES (
        250.00,
        250.00,
        0.00,
        true,
        false,
        date_trunc('week', CURRENT_DATE),
        date_trunc('week', CURRENT_DATE) + interval '6 days 23 hours 59 minutes 59 seconds'
    )
    RETURNING id INTO v_new_pool_id;
    
    -- Log the pool creation
    RAISE NOTICE 'Created new weekly pool with ID: %', v_new_pool_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the views
COMMENT ON MATERIALIZED VIEW public.leaderboard_cache IS 'Materialized view for fast leaderboard queries, refreshed every 15 minutes';
COMMENT ON MATERIALIZED VIEW public.badge_statistics IS 'Materialized view for badge distribution statistics, refreshed every 15 minutes';

-- Create unique indexes to allow CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_leaderboard_cache_user_id ON public.leaderboard_cache(user_id);
CREATE UNIQUE INDEX idx_badge_statistics_unique ON public.badge_statistics(badge_level, gender);
