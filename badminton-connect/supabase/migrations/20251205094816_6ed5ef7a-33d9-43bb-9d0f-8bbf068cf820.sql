-- Drop unused messages table first (has foreign key to chat_rooms)
DROP TABLE IF EXISTS public.messages;

-- Drop unused chat_rooms table
DROP TABLE IF EXISTS public.chat_rooms;