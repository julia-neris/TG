-- Add user_id column to transcription_history
ALTER TABLE public.transcription_history 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public delete access" ON public.transcription_history;
DROP POLICY IF EXISTS "Allow public insert access" ON public.transcription_history;
DROP POLICY IF EXISTS "Allow public read access" ON public.transcription_history;
DROP POLICY IF EXISTS "Allow public update access" ON public.transcription_history;

-- Create user-based RLS policies
CREATE POLICY "Users can view their own transcriptions"
ON public.transcription_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transcriptions"
ON public.transcription_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcriptions"
ON public.transcription_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions"
ON public.transcription_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);