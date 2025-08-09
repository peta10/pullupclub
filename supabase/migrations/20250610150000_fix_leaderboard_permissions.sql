-- Grant SELECT to authenticated and anon roles for the materialized view
GRANT SELECT ON leaderboard_cache TO authenticated;
GRANT SELECT ON leaderboard_cache TO anon;

-- Refresh the materialized view to ensure it's up to date
REFRESH MATERIALIZED VIEW leaderboard_cache;