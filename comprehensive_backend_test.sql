-- ==========================================
-- COMPREHENSIVE BACKEND TEST SUITE
-- This will test EVERY aspect of your backend fixes
-- Run this in Supabase SQL Editor to verify everything is working
-- ==========================================

-- Initialize test tracking
DROP TABLE IF EXISTS test_results;
CREATE TEMP TABLE test_results (
    test_name TEXT,
    status TEXT,
    details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Helper function for recording test results
CREATE OR REPLACE FUNCTION record_test(test_name TEXT, status TEXT, details TEXT DEFAULT '')
RETURNS VOID AS $$
BEGIN
    INSERT INTO test_results (test_name, status, details) 
    VALUES (test_name, status, details);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TEST 1: SCHEMA FIXES VERIFICATION
-- ==========================================

-- Test 1.1: Check user_earnings table has dollars_earned column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_earnings' 
        AND column_name = 'dollars_earned' 
        AND table_schema = 'public'
    ) THEN
        PERFORM record_test('user_earnings.dollars_earned_exists', 'PASS', 'Column exists in schema');
    ELSE
        PERFORM record_test('user_earnings.dollars_earned_exists', 'FAIL', 'Missing dollars_earned column');
    END IF;
END $$;

-- Test 1.2: Check weekly_pools table has new columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'weekly_pools' 
        AND column_name = 'remaining_dollars' 
        AND table_schema = 'public'
    ) THEN
        PERFORM record_test('weekly_pools.remaining_dollars_exists', 'PASS', 'Column exists in schema');
    ELSE
        PERFORM record_test('weekly_pools.remaining_dollars_exists', 'FAIL', 'Missing remaining_dollars column');
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'weekly_pools' 
        AND column_name = 'is_current' 
        AND table_schema = 'public'
    ) THEN
        PERFORM record_test('weekly_pools.is_current_exists', 'PASS', 'Column exists in schema');
    ELSE
        PERFORM record_test('weekly_pools.is_current_exists', 'FAIL', 'Missing is_current column');
    END IF;
END $$;

-- Test 1.3: Check admin_roles table structure
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'admin_roles' 
    AND table_schema = 'public'
    AND column_name IN ('user_id', 'created_at', 'role', 'is_active', 'permissions');
    
    IF col_count = 5 THEN
        PERFORM record_test('admin_roles.structure_complete', 'PASS', '5/5 required columns present');
    ELSE
        PERFORM record_test('admin_roles.structure_complete', 'FAIL', 'Only ' || col_count || '/5 columns present');
    END IF;
END $$;

-- ==========================================
-- TEST 2: RLS POLICIES VERIFICATION
-- ==========================================

-- Test 2.1: Check admin_roles RLS is enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'admin_roles' 
        AND schemaname = 'public' 
        AND rowsecurity = true
    ) THEN
        PERFORM record_test('admin_roles.rls_enabled', 'PASS', 'Row Level Security is enabled');
    ELSE
        PERFORM record_test('admin_roles.rls_enabled', 'FAIL', 'RLS not enabled on admin_roles');
    END IF;
END $$;

-- Test 2.2: Check admin_roles policies exist
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'admin_roles' 
    AND schemaname = 'public';
    
    IF policy_count >= 2 THEN
        PERFORM record_test('admin_roles.policies_exist', 'PASS', policy_count || ' policies configured');
    ELSE
        PERFORM record_test('admin_roles.policies_exist', 'FAIL', 'Only ' || policy_count || ' policies found');
    END IF;
END $$;

-- ==========================================
-- TEST 3: SECURITY ENHANCEMENTS VERIFICATION
-- ==========================================

-- Test 3.1: Check security_logs table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'security_logs' 
        AND table_schema = 'public'
    ) THEN
        PERFORM record_test('security_logs.table_exists', 'PASS', 'Security logging table created');
    ELSE
        PERFORM record_test('security_logs.table_exists', 'FAIL', 'Security logs table missing');
    END IF;
END $$;

-- Test 3.2: Check security function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'log_security_event' 
        AND routine_schema = 'public'
    ) THEN
        PERFORM record_test('security_function.exists', 'PASS', 'Security logging function available');
    ELSE
        PERFORM record_test('security_function.exists', 'FAIL', 'Security function missing');
    END IF;
END $$;

-- ==========================================
-- TEST 4: INDEX VERIFICATION
-- ==========================================

-- Test 4.1: Check foreign key indexes exist
DO $$
DECLARE
    index_count INTEGER;
    expected_indexes TEXT[] := ARRAY[
        'idx_badge_assignment_metrics_badge_id',
        'idx_messages_log_user_id',
        'idx_notification_queue_template_id',
        'idx_notification_queue_user_id',
        'idx_payout_requests_paid_by',
        'idx_pool_logs_pool_id',
        'idx_profiles_admin_role_id',
        'idx_subscriptions_user_id',
        'idx_user_badges_badge_id',
        'idx_user_badges_submission_id',
        'idx_weekly_earnings_user_id',
        'idx_weekly_earnings_weekly_pool_id'
    ];
    idx TEXT;
BEGIN
    index_count := 0;
    FOREACH idx IN ARRAY expected_indexes LOOP
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = idx 
            AND schemaname = 'public'
        ) THEN
            index_count := index_count + 1;
        END IF;
    END LOOP;
    
    IF index_count = array_length(expected_indexes, 1) THEN
        PERFORM record_test('foreign_key_indexes.complete', 'PASS', 'All ' || index_count || ' FK indexes exist');
    ELSE
        PERFORM record_test('foreign_key_indexes.complete', 'FAIL', 'Only ' || index_count || '/' || array_length(expected_indexes, 1) || ' indexes found');
    END IF;
END $$;

-- ==========================================
-- TEST 5: FUNCTIONAL TESTING
-- ==========================================

-- Test 5.1: Test admin_roles query (the one that was failing with 406)
DO $$
DECLARE
    query_result RECORD;
BEGIN
    -- This query was causing 406 errors before the fix
    SELECT * INTO query_result FROM public.admin_roles LIMIT 1;
    PERFORM record_test('admin_roles.query_functional', 'PASS', 'Admin roles query executes without error');
EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('admin_roles.query_functional', 'FAIL', 'Query failed: ' || SQLERRM);
END $$;

-- Test 5.2: Test user_earnings with dollars_earned column
DO $$
DECLARE
    test_record RECORD;
BEGIN
    -- Try to select the previously missing column
    SELECT dollars_earned INTO test_record FROM public.user_earnings LIMIT 1;
    PERFORM record_test('user_earnings.dollars_earned_query', 'PASS', 'dollars_earned column accessible');
EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('user_earnings.dollars_earned_query', 'FAIL', 'Column query failed: ' || SQLERRM);
END $$;

-- Test 5.3: Test weekly_pools with new columns
DO $$
DECLARE
    test_record RECORD;
BEGIN
    SELECT remaining_dollars, is_current INTO test_record FROM public.weekly_pools LIMIT 1;
    PERFORM record_test('weekly_pools.new_columns_query', 'PASS', 'New columns accessible');
EXCEPTION WHEN OTHERS THEN
    PERFORM record_test('weekly_pools.new_columns_query', 'FAIL', 'New columns query failed: ' || SQLERRM);
END $$;

-- ==========================================
-- TEST 6: PERFORMANCE VERIFICATION
-- ==========================================

-- Test 6.1: Check materialized view still exists (as requested)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leaderboard_cache' 
        AND table_schema = 'public'
        AND table_type = 'BASE TABLE'  -- Materialized views show as BASE TABLE
    ) THEN
        PERFORM record_test('leaderboard_cache.preserved', 'PASS', 'Materialized view preserved as requested');
    ELSE
        PERFORM record_test('leaderboard_cache.preserved', 'FAIL', 'Leaderboard cache missing');
    END IF;
END $$;

-- Test 6.2: Verify database statistics are updated
DO $$
DECLARE
    stats_updated BOOLEAN := false;
BEGIN
    -- Check if any table has recent analyze stats
    SELECT EXISTS (
        SELECT 1 FROM pg_stat_user_tables 
        WHERE schemaname = 'public' 
        AND last_analyze > NOW() - INTERVAL '1 hour'
    ) INTO stats_updated;
    
    IF stats_updated THEN
        PERFORM record_test('database.statistics_updated', 'PASS', 'Database statistics recently updated');
    ELSE
        PERFORM record_test('database.statistics_updated', 'WARN', 'Statistics may need updating');
    END IF;
END $$;

-- ==========================================
-- TEST 7: DATA INTEGRITY CHECKS
-- ==========================================

-- Test 7.1: Check for any obvious data corruption
DO $$
DECLARE
    corruption_found BOOLEAN := false;
    table_count INTEGER;
BEGIN
    -- Check if core tables exist and have expected structure
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'submissions', 'weekly_pools', 'user_earnings', 'admin_roles');
    
    IF table_count = 5 THEN
        PERFORM record_test('data_integrity.core_tables', 'PASS', 'All 5 core tables present');
    ELSE
        PERFORM record_test('data_integrity.core_tables', 'FAIL', 'Only ' || table_count || '/5 core tables found');
    END IF;
END $$;

-- ==========================================
-- FINAL RESULTS SUMMARY
-- ==========================================

-- Generate comprehensive test report
DO $$
DECLARE
    result_text TEXT := '';
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'COMPREHENSIVE BACKEND TEST RESULTS';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    
    -- Loop through test results
    FOR result_text IN 
        SELECT 
            CASE 
                WHEN status = 'PASS' THEN '✅ ' || test_name || ': ' || details
                WHEN status = 'FAIL' THEN '❌ ' || test_name || ': ' || details
                WHEN status = 'WARN' THEN '⚠️ ' || test_name || ': ' || details
                ELSE '🔸 ' || test_name || ': ' || details
            END
        FROM test_results 
        ORDER BY 
            CASE status 
                WHEN 'FAIL' THEN 1 
                WHEN 'WARN' THEN 2 
                WHEN 'PASS' THEN 3 
            END,
            test_name
    LOOP
        RAISE NOTICE '%', result_text;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TEST SUMMARY';
    RAISE NOTICE '===========================================';
    
    -- Summary statistics
    FOR result_text IN 
        SELECT 
            CASE 
                WHEN status = 'PASS' THEN '✅ Passed: ' || COUNT(*) || ' (' || ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_results), 1) || '%)'
                WHEN status = 'FAIL' THEN '❌ Failed: ' || COUNT(*) || ' (' || ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_results), 1) || '%)'
                WHEN status = 'WARN' THEN '⚠️ Warnings: ' || COUNT(*) || ' (' || ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_results), 1) || '%)'
                ELSE '🔸 Other: ' || COUNT(*) || ' (' || ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM test_results), 1) || '%)'
            END
        FROM test_results 
        GROUP BY status
        ORDER BY 
            CASE status 
                WHEN 'FAIL' THEN 1 
                WHEN 'WARN' THEN 2 
                WHEN 'PASS' THEN 3 
            END
    LOOP
        RAISE NOTICE '%', result_text;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'OVERALL ASSESSMENT';
    RAISE NOTICE '===========================================';
    
    -- Overall assessment
    SELECT 
        CASE 
            WHEN (SELECT COUNT(*) FROM test_results WHERE status = 'FAIL') = 0 
            THEN '🟢 BACKEND STATUS: HEALTHY - All critical tests passing'
            WHEN (SELECT COUNT(*) FROM test_results WHERE status = 'FAIL') <= 2
            THEN '🟡 BACKEND STATUS: MOSTLY HEALTHY - Minor issues detected'
            ELSE '🔴 BACKEND STATUS: UNHEALTHY - Significant problems detected'
        END ||
        ' | ' ||
        (SELECT COUNT(*) FROM test_results WHERE status = 'PASS') || ' passing, ' ||
        (SELECT COUNT(*) FROM test_results WHERE status = 'WARN') || ' warnings, ' ||
        (SELECT COUNT(*) FROM test_results WHERE status = 'FAIL') || ' failures'
    INTO result_text;
    
    RAISE NOTICE '%', result_text;
    
    SELECT 
        CASE 
            WHEN (SELECT COUNT(*) FROM test_results WHERE status = 'FAIL') = 0 
            THEN '✅ RECOMMENDATION: Backend is ready for production use'
            WHEN (SELECT COUNT(*) FROM test_results WHERE status = 'FAIL') <= 2
            THEN '⚠️ RECOMMENDATION: Address failing tests before full deployment'
            ELSE '❌ RECOMMENDATION: Significant fixes needed before deployment'
        END
    INTO result_text;
    
    RAISE NOTICE '%', result_text;
    RAISE NOTICE 'Next step: Run error log analysis after test completion';
    
END $$;

-- Also show results in tabular format for easy reading
SELECT 
    test_name as "Test Name",
    CASE 
        WHEN status = 'PASS' THEN '✅ PASS'
        WHEN status = 'FAIL' THEN '❌ FAIL'
        WHEN status = 'WARN' THEN '⚠️ WARN'
        ELSE status
    END as "Status",
    details as "Details"
FROM test_results 
ORDER BY 
    CASE status 
        WHEN 'FAIL' THEN 1 
        WHEN 'WARN' THEN 2 
        WHEN 'PASS' THEN 3 
    END,
    test_name;

-- Clean up
DROP FUNCTION record_test(TEXT, TEXT, TEXT);
DROP TABLE test_results;

SELECT 'Test suite completed successfully' as final_status;
