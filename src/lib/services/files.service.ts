import { supabase } from '$lib/supabase';

export const filesService = {
    // Upload file using backend API
    async upload(file: File, visibleName?: string, bucket: string = 'shared'): Promise<any> {
        if (!file) {
            throw new Error('No file provided for upload');
        }
        
        console.log(`Uploading file via backend: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
        
        try {
            // Create form data for backend upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', bucket);
            if (visibleName) {
                formData.append('visibleName', visibleName);
            }
            
            // Send to backend API
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include' // Include cookies for authentication
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(errorData.error || `Upload failed with status ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }
            
            console.log('Backend upload successful:', result.file);
            return result.file;
            
        } catch (uploadError) {
            console.error('Upload error:', uploadError);
            
            // Re-throw with user-friendly messages
            if (uploadError instanceof Error) {
                if (uploadError.message.includes('Failed to fetch') || uploadError.message.includes('network')) {
                    throw new Error('Upload failed due to network error. Please check your connection and try again.');
                }
                throw uploadError;
            }
            
            throw new Error('Upload failed due to an unexpected error. Please try again.');
        }
    },

    // Create file record in database
    async create(fileData: {
        v_name: string;
        p_name: string;
    }) {
        if (!fileData.v_name || !fileData.p_name) {
            throw new Error('Both visible name and physical name are required');
        }
        
        const { data, error } = await supabase
            .from('files')
            .insert(fileData)
            .select('file_id')
            .single();

        if (error) {
            console.error('File record creation error:', error);
            throw new Error(`Failed to create file record: ${error.message}`);
        }
        
        return data;
    },

    // Get download URL for file
    async getDownloadUrl(fileName: string, bucket: string = 'shared', expiresIn: number = 3600) {
        if (!fileName) {
            throw new Error('Filename is required for download URL generation');
        }
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(fileName, expiresIn);

        if (error) {
            console.error('Download URL generation error:', error);
            throw new Error(`Failed to generate download URL: ${error.message}`);
        }
        
        return data?.signedUrl || null;
    },

    // Delete file from storage
    async delete(fileName: string, bucket: string = 'shared') {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([fileName]);

        if (error) throw error;
        return true;
    },

    // Get file info via backend API
    async getInfo(file_id: number) {
        try {
            const response = await fetch(`/api/files/upload?id=${file_id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to get file info' }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            
            const result = await response.json();
            return result.file;
            
        } catch (error) {
            console.error('Get file info error:', error);
            throw error instanceof Error ? error : new Error('Failed to get file information');
        }
    },

    // Update file record
    async update(file_id: number, updates: Partial<{
        v_name: string;
        p_name: string;
    }>) {
        const { data, error } = await supabase
            .from('files')
            .update(updates)
            .eq('file_id', file_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};