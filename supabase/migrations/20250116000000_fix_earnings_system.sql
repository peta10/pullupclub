-- Fix earnings system to match business requirements
-- 1. Everyone earns $1 per pull-up (no free first submission)
-- 2. Admins and influencers cannot earn money 
-- 3. Maintain $1000 monthly budget via weekly pools

-- Update the process_submission_earnings function
CREATE OR REPLACE FUNCTION process_submission_earnings(
  p_submission_id UUID,
  p_user_id UUID,
  p_pull_up_count INTEGER
) RETURNS JSON AS $$
DECLARE
  v_pool_id UUID;
  v_remaining_dollars DECIMAL(10,2);
  v_dollars_earned DECIMAL(10,2);
  v_is_first_submission BOOLEAN := false;
  v_existing_earning_id UUID;
  v_user_role TEXT;
  v_result JSON;
BEGIN
  -- Check if earnings already processed for this submission
  SELECT id INTO v_existing_earning_id 
  FROM user_earnings 
  WHERE submission_id = p_submission_id;
  
  IF v_existing_earning_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Earnings already processed',
      'earning_id', v_existing_earning_id
    );
  END IF;
  
  -- Check user role - admins and influencers don't earn money
  SELECT role INTO v_user_role
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Get current week's pool for record keeping
  SELECT id INTO v_pool_id
  FROM weekly_pools 
  WHERE is_current = true 
  LIMIT 1;
  
  IF v_user_role IN ('admin', 'influencer') THEN
    -- Still create a record but with $0 earnings
    INSERT INTO user_earnings (
      user_id, 
      submission_id, 
      pool_id, 
      pull_up_count, 
      dollars_earned, 
      is_first_submission
    ) VALUES (
      p_user_id, 
      p_submission_id, 
      v_pool_id, 
      p_pull_up_count, 
      0, 
      false
    ) RETURNING id INTO v_existing_earning_id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Submission processed - admins/influencers do not earn money',
      'earning_id', v_existing_earning_id,
      'dollars_earned', 0,
      'user_role', v_user_role
    );
  END IF;
  
  -- Get current week's pool with remaining balance
  SELECT id, remaining_dollars INTO v_pool_id, v_remaining_dollars
  FROM weekly_pools 
  WHERE is_current = true AND NOT is_depleted
  LIMIT 1;
  
  -- If no current pool or pool is depleted, return early
  IF v_pool_id IS NULL OR v_remaining_dollars <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No active pool or pool is depleted',
      'pool_id', v_pool_id,
      'remaining_dollars', v_remaining_dollars
    );
  END IF;
  
  -- Check if this is user's first submission this week (for tracking only)
  IF NOT EXISTS (
    SELECT 1 FROM user_earnings ue 
    JOIN weekly_pools wp ON ue.pool_id = wp.id 
    WHERE ue.user_id = p_user_id AND wp.is_current = true
  ) THEN
    v_is_first_submission := true;
  END IF;
  
  -- Calculate earnings: $1 per pull-up for ALL submissions (no free first submission)
  v_dollars_earned := LEAST(p_pull_up_count::DECIMAL, v_remaining_dollars);
  
  -- Insert earning record
  INSERT INTO user_earnings (
    user_id, 
    submission_id, 
    pool_id, 
    pull_up_count, 
    dollars_earned, 
    is_first_submission
  ) VALUES (
    p_user_id, 
    p_submission_id, 
    v_pool_id, 
    p_pull_up_count, 
    v_dollars_earned, 
    v_is_first_submission
  ) RETURNING id INTO v_existing_earning_id;
  
  -- Update pool remaining dollars only if user earned money
  IF v_dollars_earned > 0 THEN
    UPDATE weekly_pools 
    SET 
      remaining_dollars = remaining_dollars - v_dollars_earned,
      spent_dollars = spent_dollars + v_dollars_earned,
      is_depleted = (remaining_dollars - v_dollars_earned) <= 0,
      updated_at = NOW()
    WHERE id = v_pool_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Earnings processed successfully',
    'earning_id', v_existing_earning_id,
    'dollars_earned', v_dollars_earned,
    'is_first_submission', v_is_first_submission,
    'pool_id', v_pool_id,
    'user_role', v_user_role
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Error processing earnings'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
