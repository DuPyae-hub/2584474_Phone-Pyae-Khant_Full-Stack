-- Create challenges table for direct player challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  court_id UUID REFERENCES public.courts(id),
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  CONSTRAINT no_self_challenge CHECK (challenger_id != challenged_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view challenges involving them" 
ON public.challenges 
FOR SELECT 
USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Challenged users can update challenge status" 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() = challenged_id OR auth.uid() = challenger_id);

CREATE POLICY "Challengers can delete pending challenges" 
ON public.challenges 
FOR DELETE 
USING (auth.uid() = challenger_id AND status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for challenges
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;