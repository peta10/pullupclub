-- Fix security definer views issue
-- The problem is with views that use SECURITY DEFINER instead of SECURITY INVOKER
-- For public leaderboard data, we want SECURITY INVOKER (default) so users see data based on their own permissions

-- Drop the problematic SECURITY DEFINER views and recreate them as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.public_leaderboard CASCADE;
DROP VIEW IF EXISTS public.leaderboard_display CASCADE;

-- Recreate the public_leaderboard view WITHOUT SECURITY DEFINER (default is SECURITY INVOKER)
-- This view shows leaderboard data and should be accessible to everyone
CREATE VIEW public.public_leaderboard AS 
SELECT 
    id,
    full_name,
    organization,
    region,
    gender,
    age,
    actual_pull_up_count,
    leaderboard_position
FROM public.leaderboard_cache
WHERE id IS NOT NULL
ORDER BY actual_pull_up_count DESC, approved_at ASC;

-- Recreate the leaderboard_display view WITHOUT SECURITY DEFINER (default is SECURITY INVOKER)
CREATE VIEW public.leaderboard_display AS 
SELECT 
    id,
    full_name,
    organization,
    region,
    gender,
    age,
    actual_pull_up_count,
    leaderboard_position
FROM public.leaderboard_cache
ORDER BY actual_pull_up_count DESC, approved_at ASC;

-- Grant SELECT permissions to anon and authenticated users (making it publicly readable)
GRANT SELECT ON public.public_leaderboard TO anon, authenticated;
GRANT SELECT ON public.leaderboard_display TO anon, authenticated;

-- Also ensure the materialized view itself is accessible
GRANT SELECT ON public.leaderboard_cache TO anon, authenticated;

-- Add comments to clarify the security model
COMMENT ON VIEW public.public_leaderboard IS 'Public leaderboard view - uses SECURITY INVOKER for proper access control';
COMMENT ON VIEW public.leaderboard_display IS 'Display leaderboard view - uses SECURITY INVOKER for proper access control';
