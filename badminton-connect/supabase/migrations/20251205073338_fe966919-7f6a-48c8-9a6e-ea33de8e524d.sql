-- Add policy to allow authenticated users to view basic profile info for rankings/matches
CREATE POLICY "Authenticated users can view profiles for rankings" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;