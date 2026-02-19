
-- Allow anonymous users to upload to guest/ prefix in video-uploads bucket
CREATE POLICY "Guest users can upload videos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'video-uploads'
  AND (storage.foldername(name))[1] = 'guest'
);

-- Allow service role / anon to select from video-uploads (edge function uses service role, but for completeness)
CREATE POLICY "Guest users can read their uploads"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'video-uploads'
  AND (storage.foldername(name))[1] = 'guest'
);
