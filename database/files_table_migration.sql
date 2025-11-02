-- Migration to update files table for backend file upload support
-- This adds necessary columns for better file management

-- Add new columns to files table if they don't exist
DO $$
BEGIN
    -- Add file_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'file_size') THEN
        ALTER TABLE files ADD COLUMN file_size BIGINT;
    END IF;
    
    -- Add file_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'file_type') THEN
        ALTER TABLE files ADD COLUMN file_type TEXT;
    END IF;
    
    -- Add bucket column (default to 'shared')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'bucket') THEN
        ALTER TABLE files ADD COLUMN bucket TEXT DEFAULT 'shared';
    END IF;
    
    -- Add uploaded_by column to track who uploaded the file
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'uploaded_by') THEN
        ALTER TABLE files ADD COLUMN uploaded_by UUID;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'created_at') THEN
        ALTER TABLE files ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'files' AND column_name = 'updated_at') THEN
        ALTER TABLE files ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create index on uploaded_by for performance
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- Create index on bucket for performance
CREATE INDEX IF NOT EXISTS idx_files_bucket ON files(bucket);

-- Create index on file_type for filtering
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);

-- Update RLS policies for files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read files" ON files;
DROP POLICY IF EXISTS "Users can upload files" ON files;
DROP POLICY IF EXISTS "Users can update their files" ON files;
DROP POLICY IF EXISTS "Users can delete their files" ON files;

-- Create RLS policies for files table
-- Allow users to read files (you may want to restrict this based on your business logic)
CREATE POLICY "Users can read files" ON files
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON files
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());

-- Allow users to update files they uploaded
CREATE POLICY "Users can update their files" ON files
    FOR UPDATE 
    USING (auth.uid() = uploaded_by)
    WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to delete files they uploaded
CREATE POLICY "Users can delete their files" ON files
    FOR DELETE 
    USING (auth.uid() = uploaded_by);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to link uploaded_by to profiles table
-- (uncomment if you want to enforce referential integrity)
-- ALTER TABLE files 
-- ADD CONSTRAINT fk_files_uploaded_by 
-- FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add some helpful comments
COMMENT ON COLUMN files.file_size IS 'File size in bytes';
COMMENT ON COLUMN files.file_type IS 'MIME type of the file (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN files.bucket IS 'Supabase storage bucket name where file is stored';
COMMENT ON COLUMN files.uploaded_by IS 'UUID of the user who uploaded the file';
COMMENT ON COLUMN files.v_name IS 'Visible/display name of the file';
COMMENT ON COLUMN files.p_name IS 'Physical/storage name of the file';

-- Sample query to check the updated table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'files' 
-- ORDER BY ordinal_position;