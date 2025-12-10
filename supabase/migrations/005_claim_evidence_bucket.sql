-- Create the claim-evidence storage bucket for claim proof/evidence uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'claim-evidence',
  'claim-evidence',
  true,  -- Make bucket public for read access (controlled via RLS)
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

-- Storage policies for claim-evidence bucket

-- Allow authenticated users to read evidence files (they should be visible to claim parties)
CREATE POLICY "Authenticated users can read claim evidence"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'claim-evidence'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload evidence files
CREATE POLICY "Authenticated users can upload claim evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'claim-evidence'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own evidence files
CREATE POLICY "Users can update their own claim evidence"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'claim-evidence'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own evidence files
CREATE POLICY "Users can delete their own claim evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'claim-evidence'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policy for claim_evidence table to allow inserts
CREATE POLICY "Claimants can add evidence to their claims"
ON claim_evidence FOR INSERT
WITH CHECK (
  claim_id IN (
    SELECT id FROM claims WHERE claimant_id = auth.uid()
  )
);

-- Update notifications table to include message column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE notifications ADD COLUMN message TEXT;
  END IF;
END $$;
