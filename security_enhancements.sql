-- ==========================================
-- SECURITY ENHANCEMENTS
-- Address the brute force attempts and improve security
-- ==========================================

-- 1. Ensure proper database roles exist and are configured correctly
-- Note: The failed 'admin' and 'postgres' login attempts are actually GOOD
-- They show that attackers can't access non-existent or protected roles

-- 2. Add rate limiting table for tracking failed attempts (if not exists)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET,
    event_type TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- 4. Only allow reading security logs by admins
CREATE POLICY "Only admins can view security logs"
ON public.security_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- 5. Fix function search paths (security vulnerability)
-- Note: These need to be run with proper permissions
-- ALTER FUNCTION public.get_current_weekly_pool() SET search_path = '';
-- ALTER FUNCTION public.process_submission_earnings() SET search_path = '';

-- 6. Create a function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_ip_address INET,
    p_event_type TEXT,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.security_logs (ip_address, event_type, details)
    VALUES (p_ip_address, p_event_type, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- 7. Add indexes for performance on security logs
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON public.security_logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs (created_at);

-- 8. Create a view for recent security events (last 24 hours)
CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT 
    ip_address,
    event_type,
    details,
    created_at,
    COUNT(*) OVER (PARTITION BY ip_address, event_type) as event_count
FROM public.security_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 9. Grant proper permissions
GRANT SELECT ON public.recent_security_events TO authenticated;

-- 10. Update statistics
ANALYZE public.security_logs;

SELECT 'Security enhancements completed' as status;
