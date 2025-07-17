-- Add is_approved column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_approved') THEN
        ALTER TABLE users ADD COLUMN is_approved boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add identity_url column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'identity_url') THEN
        ALTER TABLE users ADD COLUMN identity_url text;
    END IF;
END $$;

-- Add other tutor-related columns if they don't exist
DO $$ 
BEGIN
    -- Add birthday column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'birthday') THEN
        ALTER TABLE users ADD COLUMN birthday text;
    END IF;

    -- Add class_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'class_size') THEN
        ALTER TABLE users ADD COLUMN class_size text;
    END IF;

    -- Add education_level column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'education_level') THEN
        ALTER TABLE users ADD COLUMN education_level text;
    END IF;

    -- Add subjects_teach column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subjects_teach') THEN
        ALTER TABLE users ADD COLUMN subjects_teach text[];
    END IF;

    -- Add user_role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'user_role') THEN
        ALTER TABLE users ADD COLUMN user_role text;
    END IF;

    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email text;
    END IF;

    -- Add first_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name text;
    END IF;

    -- Add last_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name text;
    END IF;
END $$;

-- Create identity-proof storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-proof', 'identity-proof', false)
ON CONFLICT (id) DO NOTHING;

-- Add storage policy for identity-proof bucket
CREATE POLICY "Users can upload their own identity documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'identity-proof' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own identity documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'identity-proof' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own identity documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'identity-proof' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own identity documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'identity-proof' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
