-- Create table for voice analysis session history
CREATE TABLE public.voice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  overall_score INTEGER NOT NULL,
  pace_score INTEGER NOT NULL,
  confidence_score INTEGER NOT NULL,
  clarity_score INTEGER NOT NULL,
  transcript TEXT,
  feedback JSONB,
  negotiation_tips TEXT[],
  communication_tips TEXT[],
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own sessions"
  ON public.voice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.voice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.voice_sessions FOR DELETE
  USING (auth.uid() = user_id);