import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/zip',
    'application/x-rar-compressed',
    'video/mp4',
    'video/mpeg',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'text/csv',
    'application/xml'
];

function sanitizeFileName(fileName: string): string {
    // Remove special characters and spaces, keep only alphanumeric, dots, hyphens, and underscores
    const sanitized = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    // Add timestamp to prevent conflicts
    const timestamp = Date.now();
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    
    return `${nameWithoutExt}_${timestamp}${extension}`;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucket = (formData.get('bucket') as string) || 'shared';
        const visibleName = formData.get('visibleName') as string;

        // Validate file
        if (!file) {
            return json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return json(
                { 
                    error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 10MB limit` 
                },
                { status: 400 }
            );
        }

        // Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return json(
                { 
                    error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
                },
                { status: 400 }
            );
        }

        // Set session in supabase client
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return json(
                { error: 'Invalid authentication' },
                { status: 401 }
            );
        }

        // Sanitize file name
        const physicalName = sanitizeFileName(file.name);
        const displayName = visibleName || file.name;

        console.log(`Backend uploading file: ${file.name} -> ${physicalName} (${(file.size / 1024).toFixed(2)}KB)`);

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(physicalName, fileBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            
            // Handle specific errors
            if (uploadError.message?.includes('already exists')) {
                return json(
                    { error: 'A file with this name already exists' },
                    { status: 409 }
                );
            }
            
            return json(
                { error: `Upload failed: ${uploadError.message}` },
                { status: 500 }
            );
        }

        // Create file record in database
        const { data: fileRecord, error: dbError } = await supabase
            .from('files')
            .insert({
                v_name: displayName,
                p_name: physicalName,
                file_size: file.size,
                file_type: file.type,
                bucket: bucket,
                uploaded_by: user.id
            })
            .select('file_id, v_name, p_name, file_size, file_type, created_at')
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            
            // Clean up uploaded file if database insert fails
            await supabase.storage.from(bucket).remove([physicalName]);
            
            return json(
                { error: `Failed to create file record: ${dbError.message}` },
                { status: 500 }
            );
        }

        // Generate download URL
        const { data: urlData, error: urlError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(physicalName, 3600); // 1 hour expiry

        const downloadUrl = urlError ? null : urlData?.signedUrl;

        console.log('File uploaded successfully:', fileRecord);

        return json({
            success: true,
            file: {
                ...fileRecord,
                downloadUrl
            }
        });

    } catch (error) {
        console.error('Unexpected upload error:', error);
        return json(
            { error: 'Internal server error during file upload' },
            { status: 500 }
        );
    }
};

// Optional: GET endpoint to retrieve file info
export const GET: RequestHandler = async ({ url, cookies }) => {
    try {
        const fileId = url.searchParams.get('id');
        
        if (!fileId) {
            return json(
                { error: 'File ID is required' },
                { status: 400 }
            );
        }

        // Authenticate user
        const sessionCookie = cookies.get('sb-access-token');
        const refreshCookie = cookies.get('sb-refresh-token');

        if (!sessionCookie || !refreshCookie) {
            return json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { data: { user }, error: authError } = await supabase.auth.setSession({
            access_token: sessionCookie,
            refresh_token: refreshCookie
        });

        if (authError || !user) {
            return json(
                { error: 'Invalid authentication' },
                { status: 401 }
            );
        }

        // Get file info
        const { data: fileData, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('file_id', fileId)
            .single();

        if (fileError) {
            return json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Generate download URL
        const { data: urlData, error: urlError } = await supabase.storage
            .from(fileData.bucket || 'shared')
            .createSignedUrl(fileData.p_name, 3600);

        const downloadUrl = urlError ? null : urlData?.signedUrl;

        return json({
            file: {
                ...fileData,
                downloadUrl
            }
        });

    } catch (error) {
        console.error('Error retrieving file:', error);
        return json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};