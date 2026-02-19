
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (optional user profiles)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversions table
CREATE TABLE public.conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  input_filename TEXT NOT NULL,
  input_format TEXT,
  output_format TEXT NOT NULL,
  output_filename TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploading','converting','ready','failed')),
  progress INTEGER DEFAULT 0,
  input_path TEXT,
  output_path TEXT,
  error_message TEXT,
  file_size BIGINT,
  duration REAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Logged-in users see their own conversions; guests see rows where user_id IS NULL (session tracked client-side)
CREATE POLICY "Users can view own conversions" ON public.conversions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert conversions" ON public.conversions FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own conversions" ON public.conversions FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- YouTube clips table
CREATE TABLE public.youtube_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  youtube_url TEXT NOT NULL,
  video_title TEXT,
  video_thumbnail TEXT,
  video_duration INTEGER,
  start_time INTEGER DEFAULT 0,
  end_time INTEGER,
  aspect_ratio TEXT DEFAULT '16:9',
  output_format TEXT DEFAULT 'mp4',
  quality TEXT DEFAULT '720p',
  watermark_text TEXT,
  mode TEXT DEFAULT 'manual' CHECK (mode IN ('manual','ai')),
  output_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.youtube_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips" ON public.youtube_clips FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert clips" ON public.youtube_clips FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own clips" ON public.youtube_clips FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON public.conversions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clips_updated_at BEFORE UPDATE ON public.youtube_clips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('video-uploads', 'video-uploads', false, 524288000, ARRAY['video/*', 'application/octet-stream']),
  ('video-outputs', 'video-outputs', true, 524288000, ARRAY['video/*', 'image/gif', 'application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'video-uploads');
CREATE POLICY "Users can view own uploads" ON storage.objects FOR SELECT USING (bucket_id = 'video-uploads');
CREATE POLICY "Output files are public" ON storage.objects FOR SELECT USING (bucket_id = 'video-outputs');
CREATE POLICY "Service can write outputs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'video-outputs');
