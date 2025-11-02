# Backend File Upload Setup Guide

This guide explains how to set up the backend file upload system for your CRM application. This approach provides better security, server-side validation, and avoids RLS policy issues by handling authentication on the backend.

## 🚀 Features

- **Server-side validation**: File type, size, and content validation
- **Automatic file renaming**: Prevents conflicts with timestamp-based names
- **Enhanced security**: Authentication handled on backend
- **Comprehensive error handling**: User-friendly error messages
- **File metadata tracking**: Size, type, upload time, and uploader info
- **Signed URLs**: Secure file downloads with expiration

## 📁 File Structure

```
src/
├── routes/api/files/upload/
│   └── +server.ts                 # Backend upload API endpoint
├── lib/services/
│   └── files.service.ts           # Updated service for backend uploads
├── lib/components/
│   └── Chatbox.svelte            # Updated to use backend uploads
database/
└── files_table_migration.sql     # Database schema updates
```

## 🛠️ Setup Instructions

### 1. Run Database Migration

Execute the migration script to add necessary columns to the files table:

```bash
# In your Supabase SQL editor or psql, run:
\i database/files_table_migration.sql
```

Or copy and paste the contents of `database/files_table_migration.sql` into your Supabase SQL editor.

### 2. Configure Supabase Storage Bucket

Ensure your storage bucket is properly configured:

```sql
-- Create the shared bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared', 'shared', false);

-- Set up storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read files" ON storage.objects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Update Environment Variables

Make sure your Supabase configuration is properly set up in your environment.

## 📝 API Endpoints

### POST `/api/files/upload`

Upload a file to the server.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File to upload (required)
  - `bucket`: Storage bucket name (optional, defaults to 'shared')
  - `visibleName`: Display name for the file (optional, uses original filename)

**Response:**
```json
{
  "success": true,
  "file": {
    "file_id": 123,
    "v_name": "document.pdf",
    "p_name": "document_1640995200000.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "created_at": "2025-01-01T12:00:00Z",
    "downloadUrl": "https://..."
  }
}
```

**Error Response:**
```json
{
  "error": "File size exceeds the 10MB limit"
}
```

### GET `/api/files/upload?id={file_id}`

Get file information and download URL.

**Response:**
```json
{
  "file": {
    "file_id": 123,
    "v_name": "document.pdf",
    "p_name": "document_1640995200000.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "bucket": "shared",
    "uploaded_by": "uuid-here",
    "created_at": "2025-01-01T12:00:00Z",
    "downloadUrl": "https://..."
  }
}
```

## 🔒 Security Features

### File Type Validation

Only specific file types are allowed:
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, TXT, DOC, DOCX, XLS, XLSX

### File Size Limits

- Maximum file size: 10MB
- Size validation happens before upload

### Authentication

- All endpoints require authentication via session cookies
- Files are linked to the uploading user
- RLS policies ensure proper access control

### File Naming

Files are automatically renamed with timestamps to prevent conflicts:
- Original: `document.pdf`
- Stored as: `document_1640995200000.pdf`

## 🔧 Service Usage

### Upload a File

```typescript
import { filesService } from '$lib/services';

try {
  const uploadedFile = await filesService.upload(
    file,           // File object
    'My Document',  // Visible name (optional)
    'shared'        // Bucket (optional)
  );
  
  console.log('File uploaded:', uploadedFile);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### Get File Information

```typescript
try {
  const fileInfo = await filesService.getInfo(123);
  console.log('File info:', fileInfo);
} catch (error) {
  console.error('Failed to get file info:', error.message);
}
```

## 🎨 Frontend Integration

### Updated Chatbox Component

The Chatbox component has been updated to use the backend upload system:

```typescript
// Old way (direct Supabase)
await filesService.upload(selectedFile, physicalName);
await filesService.create({ v_name, p_name });

// New way (backend API)
const uploadedFile = await filesService.upload(
  selectedFile, 
  selectedFile.name,
  'shared'
);
// File record is automatically created by backend
```

### Error Handling

The frontend now handles backend-specific errors:

- **File size errors**: Clear message about size limits
- **File type errors**: Information about allowed types
- **Network errors**: User-friendly network error messages
- **Authentication errors**: Prompts to sign in again

## 🚨 Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | No file provided | File is missing from request |
| 400 | File size exceeds limit | File is larger than 10MB |
| 400 | File type not allowed | File type is not in allowed list |
| 401 | Authentication required | User not signed in |
| 401 | Invalid authentication | Session expired or invalid |
| 409 | File already exists | File with same name exists |
| 500 | Upload failed | General upload error |
| 500 | Database error | Failed to create file record |

## 📊 Database Schema

The files table now includes these columns:

```sql
CREATE TABLE files (
  file_id SERIAL PRIMARY KEY,
  v_name TEXT NOT NULL,           -- Visible/display name
  p_name TEXT NOT NULL,           -- Physical/storage name
  file_size BIGINT,               -- File size in bytes
  file_type TEXT,                 -- MIME type
  bucket TEXT DEFAULT 'shared',   -- Storage bucket
  uploaded_by UUID,               -- User who uploaded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔄 Migration from Frontend Upload

If you're migrating from the old frontend upload system:

1. Run the database migration script
2. Update your components to use the new service methods
3. Test file uploads and downloads
4. Remove any old frontend upload code

## 🧪 Testing

Test the upload system with:

1. **Different file types**: Test allowed and disallowed types
2. **File size limits**: Test files over 10MB
3. **Authentication**: Test without being signed in
4. **Network issues**: Test with poor connectivity
5. **Duplicate files**: Test uploading same file multiple times

## 🚀 Benefits of Backend Upload

1. **Better Security**: Server-side validation and authentication
2. **Consistent Error Handling**: Standardized error responses
3. **No RLS Issues**: Authentication handled properly on backend
4. **Better Performance**: Reduced frontend complexity
5. **Audit Trail**: Better tracking of file uploads
6. **Scalability**: Easier to add features like virus scanning, image processing, etc.

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify authentication status
3. Check file size and type requirements
4. Review the database logs for backend errors
5. Ensure storage bucket is properly configured

The backend upload system provides a robust, secure, and user-friendly file upload experience for your CRM application.