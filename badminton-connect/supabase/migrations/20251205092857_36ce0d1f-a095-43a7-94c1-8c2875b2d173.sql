-- Create direct_messages table for 1-on-1 private messaging
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
ON public.direct_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.direct_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update (mark as read) messages they received
CREATE POLICY "Users can mark messages as read"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete own sent messages"
ON public.direct_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Create index for faster queries
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(sender_id, receiver_id, created_at DESC);