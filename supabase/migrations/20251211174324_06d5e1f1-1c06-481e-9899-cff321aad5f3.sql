-- Create transcription history table
CREATE TABLE public.transcription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  instrument TEXT NOT NULL,
  file_name TEXT,
  notes JSONB NOT NULL DEFAULT '[]',
  notes_count INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security (table is public for demo purposes - no auth required)
ALTER TABLE public.transcription_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is a TCC demo without auth)
CREATE POLICY "Allow public read access" 
ON public.transcription_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.transcription_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access" 
ON public.transcription_history 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public update access" 
ON public.transcription_history 
FOR UPDATE 
USING (true);