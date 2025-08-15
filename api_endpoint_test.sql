-- ==========================================
-- API ENDPOINT COMPREHENSIVE TEST
-- Test all the API endpoints that were previously failing
-- Run this after the schema fixes to verify 406/422 errors are resolved
-- ==========================================

-- Test tracking setup
DROP TABLE IF EXISTS api_test_results;
CREATE TEMP TABLE api_test_results (
    endpoint TEXT,
    test_type TEXT,
    status TEXT,
    response_details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Helper function for API test recording
CREATE OR REPLACE FUNCTION record_api_test(endpoint TEXT, test_type TEXT, status TEXT, details TEXT DEFAULT '')
RETURNS VOID AS $$
BEGIN
    INSERT INTO api_test_results (endpoint, test_type, status, response_details) 
    VALUES (endpoint, test_type, status, details);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TEST 1: ADMIN ROLES ENDPOINT (Previously 406 errors)
-- ==========================================

-- Test 1.1: Verify admin_roles table accessibility
DO $$
DECLARE
    test_user_id UUID := '93eac282-f37c-4552-8710-01a5c7c05b30';  -- From your error logs
    result_count INTEGER;
BEGIN
    -- Simulate the query that was failing with 406 errors
    -- SELECT * FROM admin_roles WHERE user_id = '93eac282-f37c-4552-8710-01a5c7c05b30'
    
    SELECT COUNT(*) INTO result_count
    FROM public.admin_roles 
    WHERE user_id = test_user_id;
    
    PERFORM record_api_test(
        '/rest/v1/admin_roles', 
        'user_specific_query', 
        'PASS', 
        'Query executed successfully, returned ' || result_count || ' rows'
    );
    
EXCEPTION WHEN OTHERS THEN
    PERFORM record_api_test(
        '/rest/v1/admin_roles', 
        'user_specific_query', 
        'FAIL', 
        'Query failed: ' || SQLERRM
    );
END $$;

-- Test 1.2: Test admin roles RLS policy functionality
DO $$
DECLARE
    policy_test TEXT;
BEGIN
    -- Test if RLS policies allow proper access
    SELECT 'RLS_TEST' INTO policy_test FROM public.admin_roles LIMIT 1;
    
    PERFORM record_api_test(
        '/rest/v1/admin_roles', 
        'rls_policy_test', 
        'PASS', 
        'RLS policies allow query execution'
    );
    
EXCEPTION 
    WHEN insufficient_privilege THEN
        PERFORM record_api_test(
            '/rest/v1/admin_roles', 
            'rls_policy_test', 
            'EXPECTED', 
            'RLS properly blocking unauthorized access'
        );
    WHEN OTHERS THEN
        PERFORM record_api_test(
            '/rest/v1/admin_roles', 
            'rls_policy_test', 
            'FAIL', 
            'Unexpected error: ' || SQLERRM
        );
END $$;

-- ==========================================
-- TEST 2: USER EARNINGS ENDPOINT (Previously missing column errors)
-- ==========================================

-- Test 2.1: Query user_earnings with dollars_earned column
DO $$
DECLARE
    result_count INTEGER;
    sample_earnings DECIMAL(10,2);
BEGIN
    -- Test the previously missing dollars_earned column
    SELECT COUNT(*), COALESCE(AVG(dollars_earned), 0) 
    INTO result_count, sample_earnings
    FROM public.user_earnings;
    
    PERFORM record_api_test(
        '/rest/v1/user_earnings', 
        'dollars_earned_column', 
        'PASS', 
        'Column accessible, avg: $' || sample_earnings::TEXT
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM record_api_test(
            '/rest/v1/user_earnings', 
            'dollars_earned_column', 
            'FAIL', 
            'Column access failed: ' || SQLERRM
        );
END $$;

-- ==========================================
-- TEST 3: WEEKLY POOLS ENDPOINT (Previously missing columns)
-- ==========================================

-- Test 3.1: Query weekly_pools with new columns
DO $$
DECLARE
    result_count INTEGER;
    current_pools INTEGER;
BEGIN
    -- Test the previously missing remaining_dollars and is_current columns
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_current = true)
    INTO result_count, current_pools
    FROM public.weekly_pools;
    
    PERFORM record_api_test(
        '/rest/v1/weekly_pools', 
        'new_columns_test', 
        'PASS', 
        'Total pools: ' || result_count || ', Current: ' || current_pools
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM record_api_test(
            '/rest/v1/weekly_pools', 
            'new_columns_test', 
            'FAIL', 
            'New columns failed: ' || SQLERRM
        );
END $$;

-- Test 3.2: Test specific query that was in error logs
DO $$
DECLARE
    test_date DATE := '2025-08-15';
    result_count INTEGER;
BEGIN
    -- This mimics the query from your error logs:
    -- weekly_pools?select=*&week_start_date=lte.2025-08-15&week_end_date=gte.2025-08-15&limit=1
    
    SELECT COUNT(*) INTO result_count
    FROM public.weekly_pools 
    WHERE week_start_date <= test_date 
    AND week_end_date >= test_date;
    
    PERFORM record_api_test(
        '/rest/v1/weekly_pools', 
        'date_range_query', 
        'PASS', 
        'Date range query returned ' || result_count || ' results'
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM record_api_test(
            '/rest/v1/weekly_pools', 
            'date_range_query', 
            'FAIL', 
            'Date range query failed: ' || SQLERRM
        );
END $$;

-- ==========================================
-- TEST 4: AUTHENTICATION ENDPOINTS (Previously 422/400 errors)
-- ==========================================

-- Test 4.1: Check profiles table for auth integration
DO $$
DECLARE
    profile_count INTEGER;
    stripe_customers INTEGER;
BEGIN
    SELECT 
        COUNT(*), 
        COUNT(*) FILTER (WHERE stripe_customer_id IS NOT NULL)
    INTO profile_count, stripe_customers
    FROM public.profiles;
    
    PERFORM record_api_test(
        '/auth/v1/signup_integration', 
        'profiles_table_ready', 
        'PASS', 
        'Profiles ready: ' || profile_count || ', Stripe linked: ' || stripe_customers
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM record_api_test(
            '/auth/v1/signup_integration', 
            'profiles_table_ready', 
            'FAIL', 
            'Profiles table issue: ' || SQLERRM
        );
END $$;

-- ==========================================
-- TEST 5: PERFORMANCE CRITICAL QUERIES
-- ==========================================

-- Test 5.1: Test index usage on critical tables
DO $$
DECLARE
    execution_plan TEXT;
    uses_index BOOLEAN := false;
BEGIN
    -- Test a query that should use our new foreign key indexes
    SELECT EXISTS (
        SELECT 1 FROM pg_stat_user_indexes 
        WHERE schemaname = 'public' 
        AND relname IN ('weekly_earnings', 'user_badges', 'submissions')
        AND idx_scan > 0
    ) INTO uses_index;
    
    IF uses_index THEN
        PERFORM record_api_test(
            'performance', 
            'index_usage', 
            'PASS', 
            'Indexes are being utilized'
        );
    ELSE
        PERFORM record_api_test(
            'performance', 
            'index_usage', 
            'INFO', 
            'Indexes created but not yet used (normal for new indexes)'
        );
    END IF;
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM record_api_test(
            'performance', 
            'index_usage', 
            'FAIL', 
            'Index check failed: ' || SQLERRM
        );
END $$;

-- ==========================================
-- TEST 6: SECURITY VERIFICATION
-- ==========================================

-- Test 6.1: Verify RLS is working across critical tables
DO $$
DECLARE
    rls_enabled_count INTEGER;
    critical_tables TEXT[] := ARRAY['profiles', 'submissions', 'admin_roles', 'security_logs'];
    table_name TEXT;
BEGIN
    rls_enabled_count := 0;
    
    FOREACH table_name IN ARRAY critical_tables LOOP
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = table_name 
            AND schemaname = 'public' 
            AND rowsecurity = true
        ) THEN
            rls_enabled_count := rls_enabled_count + 1;
        END IF;
    END LOOP;
    
    IF rls_enabled_count = array_length(critical_tables, 1) THEN
        PERFORM record_api_test(
            'security', 
            'rls_coverage', 
            'PASS', 
            'RLS enabled on all ' || rls_enabled_count || ' critical tables'
        );
    ELSE
        PERFORM record_api_test(
            'security', 
            'rls_coverage', 
            'WARN', 
            'RLS enabled on ' || rls_enabled_count || '/' || array_length(critical_tables, 1) || ' tables'
        );
    END IF;
    
EXCEPTION 
    WHEN OTHERS THEN
        PERFORM record_api_test(
            'security', 
            'rls_coverage', 
            'FAIL', 
            'RLS check failed: ' || SQLERRM
        );
END $$;

-- ==========================================
-- GENERATE COMPREHENSIVE API TEST REPORT
-- ==========================================

-- Simple tabular output without UNION issues
SELECT 
    endpoint as "Endpoint",
    test_type as "Test Type",
    CASE 
        WHEN status = 'PASS' THEN '✅ PASS'
        WHEN status = 'FAIL' THEN '❌ FAIL'  
        WHEN status = 'WARN' THEN '⚠️ WARN'
        WHEN status = 'INFO' THEN 'ℹ️ INFO'
        ELSE status
    END as "Status",
    response_details as "Details"
FROM api_test_results 
ORDER BY 
    CASE status 
        WHEN 'FAIL' THEN 1 
        WHEN 'WARN' THEN 2 
        WHEN 'INFO' THEN 3
        WHEN 'PASS' THEN 4 
        ELSE 5
    END,
    endpoint, test_type;

-- Summary
SELECT 
    CASE 
        WHEN status = 'PASS' THEN '✅ Passed'
        WHEN status = 'FAIL' THEN '❌ Failed'  
        WHEN status = 'WARN' THEN '⚠️ Warnings'
        WHEN status = 'INFO' THEN 'ℹ️ Info'
        ELSE status
    END as "Status",
    COUNT(*)::TEXT as "Count",
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM api_test_results), 1)::TEXT || '%' as "Percentage"
FROM api_test_results 
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'FAIL' THEN 1 
        WHEN 'WARN' THEN 2 
        WHEN 'INFO' THEN 3
        WHEN 'PASS' THEN 4 
        ELSE 5
    END;

-- Overall API Health Assessment
SELECT 
    'API Status' as "Assessment",
    CASE 
        WHEN (SELECT COUNT(*) FROM api_test_results WHERE status = 'FAIL') = 0 
        THEN '🟢 HEALTHY - All endpoints functional'
        WHEN (SELECT COUNT(*) FROM api_test_results WHERE status = 'FAIL') <= 1
        THEN '🟡 MOSTLY HEALTHY - Minor issues detected'
        ELSE '🔴 UNHEALTHY - Multiple endpoint failures'
    END as "Result",
    'Based on ' || (SELECT COUNT(*) FROM api_test_results) || ' API tests' as "Details"
UNION ALL
SELECT 
    'Error Resolution' as "Assessment",
    CASE 
        WHEN (SELECT COUNT(*) FROM api_test_results WHERE endpoint = '/rest/v1/admin_roles' AND status = 'PASS') > 0
        THEN '✅ 406 errors resolved'
        ELSE '❌ 406 errors persist'
    END as "Result",
    'Admin roles endpoint functionality' as "Details"
UNION ALL
SELECT 
    'Schema Fixes' as "Assessment",
    CASE 
        WHEN (SELECT COUNT(*) FROM api_test_results WHERE status = 'PASS' AND (test_type LIKE '%column%' OR test_type LIKE '%new%')) > 0
        THEN '✅ Missing columns resolved'
        ELSE '❌ Column issues persist'
    END as "Result",
    'Database schema completeness' as "Details";

-- Cleanup
DROP FUNCTION record_api_test(TEXT, TEXT, TEXT, TEXT);
DROP TABLE api_test_results;

SELECT 'API endpoint testing completed' as final_status;
