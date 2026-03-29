
-- API usage logging table
CREATE TABLE public.api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  status_code integer,
  metadata jsonb
);

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read usage logs
CREATE POLICY "Service role can manage usage logs"
  ON public.api_usage_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can read usage logs
CREATE POLICY "Admins can read usage logs"
  ON public.api_usage_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast quota lookups
CREATE INDEX idx_api_usage_user_endpoint_created
  ON public.api_usage_log (user_id, endpoint, created_at DESC);

CREATE INDEX idx_api_usage_created
  ON public.api_usage_log (created_at DESC);

-- Circuit breaker state table
CREATE TABLE public.circuit_breaker_state (
  id integer PRIMARY KEY DEFAULT 1,
  is_tripped boolean NOT NULL DEFAULT false,
  tripped_at timestamptz,
  reason text,
  daily_global_limit integer NOT NULL DEFAULT 5000,
  per_user_daily_limit integer NOT NULL DEFAULT 50,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.circuit_breaker_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage circuit breaker"
  ON public.circuit_breaker_state FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can read circuit breaker"
  ON public.circuit_breaker_state FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.circuit_breaker_state (id, daily_global_limit, per_user_daily_limit)
VALUES (1, 5000, 50)
ON CONFLICT (id) DO NOTHING;

-- Function: check if user is within daily quota
CREATE OR REPLACE FUNCTION public.check_user_quota(_user_id uuid, _endpoint text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_count integer;
  _global_count integer;
  _per_user_limit integer;
  _global_limit integer;
  _is_tripped boolean;
BEGIN
  SELECT is_tripped, daily_global_limit, per_user_daily_limit
  INTO _is_tripped, _global_limit, _per_user_limit
  FROM public.circuit_breaker_state
  WHERE id = 1;

  IF _is_tripped THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'circuit_breaker_tripped');
  END IF;

  SELECT count(*) INTO _user_count
  FROM public.api_usage_log
  WHERE user_id = _user_id
    AND endpoint = _endpoint
    AND created_at > now() - interval '24 hours';

  IF _user_count >= _per_user_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'user_daily_limit', 'count', _user_count, 'limit', _per_user_limit);
  END IF;

  SELECT count(*) INTO _global_count
  FROM public.api_usage_log
  WHERE created_at > now() - interval '24 hours';

  IF _global_count >= _global_limit THEN
    UPDATE public.circuit_breaker_state
    SET is_tripped = true, tripped_at = now(), reason = 'Global daily limit exceeded: ' || _global_count, updated_at = now()
    WHERE id = 1;
    RETURN jsonb_build_object('allowed', false, 'reason', 'global_limit_tripped', 'count', _global_count, 'limit', _global_limit);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'user_count', _user_count, 'global_count', _global_count);
END;
$$;
