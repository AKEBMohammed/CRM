# 🔧 Supabase Storage Setup Guide

## The Problem
You're getting a "Row-Level Security policy violation" error when trying to upload files. This means your Supabase storage bucket isn't configured to allow your users to upload files.

## Quick Fix Steps

### 1. Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar

### 2. Create Storage Bucket (if not exists)
1. Click **"New bucket"**
2. Name it: `shared`
3. Make it **Public** (check the public checkbox)
4. Click **"Create bucket"**

### 3. Set Up Storage Policies
1. Click on the `shared` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**

### 4. Create Upload Policy
Add this policy for uploads:

```sql
-- Policy name: "Allow authenticated users to upload files"
-- Operation: INSERT
-- Target roles: authenticated

-- Policy definition:
(auth.role() = 'authenticated')
```

### 5. Create Read Policy  
Add this policy for downloads:

```sql
-- Policy name: "Allow everyone to read files"
-- Operation: SELECT
-- Target roles: public

-- Policy definition:
true
```

### 6. Create Update Policy (Optional)
If you want users to update their own files:

```sql
-- Policy name: "Allow users to update their own files"
-- Operation: UPDATE
-- Target roles: authenticated

-- Policy definition:
(auth.role() = 'authenticated')
```

## Alternative: Disable RLS (Not Recommended for Production)
If you want to quickly test without policies:

1. Go to **Storage** > **Settings**
2. Find the `shared` bucket
3. Click **"Disable RLS"** (only for testing!)

## SQL Commands (Advanced)
Run these in your SQL Editor if you prefer:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('shared', 'shared', true);

-- Create upload policy
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'shared');

-- Create read policy
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'shared');

-- Create update policy
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'shared');

-- Create delete policy (optional)
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'shared');
```

## Verify Setup
After setting up policies:

1. Refresh your CRM application
2. Try uploading a file in the chat
3. Check if the error is resolved

## Common Issues

### Issue: "Bucket does not exist"
- **Solution**: Create the `shared` bucket as described above

### Issue: Still getting RLS errors
- **Solution**: Make sure policies target the correct roles (`authenticated` for logged-in users)

### Issue: Files upload but can't download
- **Solution**: Add the read policy for `public` or `authenticated` users

## Test Your Setup
You can test your storage setup with this SQL query:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'shared';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'shared';
```

## Need Help?
If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify your user is authenticated (check `auth.user()` in console)
3. Make sure the bucket name matches exactly: `shared`
4. Ensure policies are enabled and correctly configured

Your CRM application should now handle file uploads properly! 🎉