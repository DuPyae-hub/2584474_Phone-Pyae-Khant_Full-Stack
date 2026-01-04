-- Add players_needed column to partner_requests
ALTER TABLE public.partner_requests 
ADD COLUMN players_needed integer NOT NULL DEFAULT 1 CHECK (players_needed >= 1 AND players_needed <= 5);

-- Create table to track multiple participants and their statuses
CREATE TABLE public.partner_request_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.partner_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'arrived', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.partner_request_participants ENABLE ROW LEVEL SECURITY;

-- Anyone can view participants of open requests
CREATE POLICY "Anyone can view participants"
ON public.partner_request_participants
FOR SELECT
USING (true);

-- Users can join requests (insert)
CREATE POLICY "Users can join requests"
ON public.partner_request_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation status
CREATE POLICY "Users can update own participation"
ON public.partner_request_participants
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can cancel their participation (delete)
CREATE POLICY "Users can cancel participation"
ON public.partner_request_participants
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_partner_request_participants_updated_at
BEFORE UPDATE ON public.partner_request_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();