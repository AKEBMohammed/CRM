# Supabase Storage Setup for Export Feature

To enable the export functionality with file storage, you need to create a storage bucket in your Supabase project:

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create Bucket"**
4. Set the bucket name to: `exports`
5. Make sure **"Public bucket"** is **UNCHECKED** (we want private access with signed URLs)
6. Click **"Create bucket"**

## Step 2: Set up Bucket Policies (Required for Security)

You need to add RLS (Row Level Security) policies to ensure users can only access their own company's export files:

### Option A: Simple Approach (Recommended)
Create policies that allow authenticated users to manage their own uploads:

```sql
-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can upload to exports bucket
CREATE POLICY "Authenticated users can upload exports" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'exports' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Users can view their own uploads in exports bucket  
CREATE POLICY "Users can view their exports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'exports' AND
  owner = auth.uid()
);

-- Policy 3: Users can delete their own uploads (optional)
CREATE POLICY "Users can delete their exports" ON storage.objects
FOR DELETE USING (
  bucket_id = 'exports' AND
  owner = auth.uid()
);
```

### Option B: Company-based Access (Advanced)
If you want company-level access control using filename parsing:

```sql
-- Policy 1: Allow users to upload files for their company
CREATE POLICY "Users can upload files for their company" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'exports' AND
  auth.uid() IN (
    SELECT p.user_id 
    FROM profiles p 
    WHERE p.company_id::text = split_part(name, '-', 4)
  )
);

-- Policy 2: Allow users to view/download files from their company
CREATE POLICY "Users can view files from their company" ON storage.objects
FOR SELECT USING (
  bucket_id = 'exports' AND
  auth.uid() IN (
    SELECT p.user_id 
    FROM profiles p 
    WHERE p.company_id::text = split_part(name, '-', 4)
  )
);
```

### How to Apply These Policies:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the policy statements above (choose Option A or B)
4. Or navigate to **Storage** → **exports bucket** → **Policies** tab and create them through the UI

**Recommendation:** Use Option A for simplicity. Each user will only see/download files they created.

## Step 3: Clean up old files (Optional)

You might want to set up a scheduled function to automatically delete old export files after a certain period to save storage space.

## Bucket Configuration Used:
- **Bucket Name:** `exports`
- **Public Access:** No (private with signed URLs)
- **File Expiration:** 1 hour (for download links)
- **Supported Formats:** CSV, JSON, XML

## File Naming Convention:
Files are automatically named with timestamp and company ID: `users-export-{user_id}-{company_id}-YYYY-MM-DDTHH-mm-ss-sssZ.format`

Example: `users-export-12345-67890-2025-09-24T10-30-15-123Z.csv`

This naming convention enables the RLS policies to work by including the company ID in the filename.
