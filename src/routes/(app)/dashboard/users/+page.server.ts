import { error, fail } from '@sveltejs/kit';
import { gql } from '$lib/graphql';
import type { Actions, PageServerLoad } from './$types';
import { getProfile, supabase } from '$lib/supabase';
import { PUBLIC_BASE_URL } from '$env/static/public';

async function addProfile(user_id: string, fullname: string, email: string, phone: string, company_id: number, role: string, added_by: number) {
    const mutationProfile = `
            mutation ($fullname: String!, $email: String!, $phone: String!, $role: user_role!, $company_id: BigInt, $user_id: UUID!, $added_by: BigInt!) {
                insertIntoprofilesCollection(
                objects: [{
                    user_id: $user_id,
                    fullname: $fullname,
                    email: $email,
                    phone: $phone,
                    role: $role,
                    company_id: $company_id,
                    added_by: $added_by
                }]
                ) {
                records {
                    user_id
                    fullname
                    email
                    phone
                    role
                    company_id
                    added_by
                }
            }
        }
`;

    const result = await gql(mutationProfile, {
        fullname: fullname,
        email: email,
        phone: phone,
        role: role,
        company_id: company_id,
        user_id: user_id,
        added_by: added_by,
    });

    if (!result) {
        return false;
    }

    return true;
}

async function getProfilesByUser(user: { company_id: number, profile_id: number, role: string }) {
    if (user.role !== 'admin') {
        return false;
    }

    let query = `
    query {
        profilesCollection(
            filter: {  company_id: { eq: "${user.company_id}" } }
        ) {
            edges {
                node {       
                    profile_id
                    fullname
                    phone
                    email
                    role
                }
            }
        }
    }
        `

    let result = await gql(query)

    if (!result) {
        return false;
    }

    let profiles = result.profilesCollection.edges.map((edge: any) => ({
        fullname: edge.node.fullname,
        email: edge.node.email,
        phone: edge.node.phone,
        role: edge.node.role,
    }));
    
    return profiles;
}



export const load: PageServerLoad = async ({ params, cookies }) => {
    let user = JSON.parse(cookies.get('user') || 'null');
    if (!user || user.role !== 'admin') {
        return fail(401, { error: 'Unauthorized access. Please log in again.' });
    }

    let profiles = await getProfilesByUser(user);
    if (!profiles) {
        return fail(500, { error: 'Failed to fetch user profiles from database.' });
    }

    console.log('Fetched profiles:', profiles);
    

    return { profiles };

};

export const actions = {
    add: async ({ request, cookies }) => {
        const formData = await request.formData();
        const fullname = formData.get('fullname');
        const role = formData.get('role');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const password = formData.get('password') || '123456';

        console.log('Add user action triggered with data:', { fullname, role, email, phone, password });
        

        const user = await getProfile()

        if (!user || user.role !== 'admin') {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        if (!fullname || !role || !email || !password || !phone) {
            return fail(400, { error: 'All fields are required. Please fill in all the information.' });
        }

        const baseUrl = PUBLIC_BASE_URL || 'http://localhost:5173';
        const emailRedirectTo = `${baseUrl}/auth`;
        const { data: newUser, error } = await supabase.auth.signUp({
            email: email.toString(),
            password: password.toString(),
            options: {
                emailRedirectTo,
            },
        });

        if (error) {
            return fail(500, { error: 'Failed to create user account: ' + error.message });
        }

        let userId = newUser.user?.id;
        if (!userId) {
            return fail(500, { error: 'Failed to retrieve user ID from created account.' });
        }

        let result = await addProfile(userId, fullname.toString(), email.toString(), phone.toString(), user.company_id, role.toString(), user.profile_id);

        if (!result) {
            return fail(500, { error: 'Failed to create user profile in database.' });
        }

        return { success: 'User added successfully!' };
    },

    import: async ({ request, cookies }) => {
        const formData = await request.formData();
        const file = formData.get('file');
        const user = await getProfile()

        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        if (!file || !(file instanceof File)) {
            return fail(400, { error: 'No file uploaded. Please select a file to import.' });
        }

        const text = await file.text();
        let users;

        try {
            if (file.name.endsWith('.json')) {
                users = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                // Parse CSV
                const lines = text.trim().split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                users = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const user_obj: any = {};

                    headers.forEach((header, index) => {
                        const key = header.toLowerCase().replace(/\s+/g, '_');
                        user_obj[key] = values[index] || '';
                    });

                    // Map CSV headers to expected fields
                    const mappedUser = {
                        fullname: user_obj.fullname || user_obj.full_name || user_obj.name,
                        role: user_obj.role || 'user',
                        email: user_obj.email,
                        phone: user_obj.phone || '',
                        password: user_obj.password || null,
                        user_id: user_obj.user_id || null
                    };

                    if (mappedUser.fullname && mappedUser.email) {
                        users.push(mappedUser);
                    }
                }
            } else {
                return fail(400, { error: 'Unsupported file format. Please use JSON or CSV files only.' });
            }
        } catch (e) {
            return fail(400, { error: 'Invalid file format or corrupted data. Please check your file and try again.' });
        }

        if (!Array.isArray(users)) {
            return fail(400, { error: 'File should contain an array of users. Please check the file format.' });
        }

        let successCount = 0;
        let failedUsers: string[] = [];

        for (let u of users) {
            if (!u.fullname || !u.email) {
                console.warn('Skipping user with missing fullname or email:', u);
                failedUsers.push(u.fullname || u.email || 'Unknown user');
                continue;
            }

            // Create user in Supabase Auth if user_id is not provided
            let userId = u.user_id;
            if (!userId) {
                const { data: newUser, error } = await supabase.auth.signUp({
                    email: u.email,
                    password: u.password,
                    options: {
                        emailRedirectTo: `${PUBLIC_BASE_URL || 'http://localhost:5173'}/auth`
                    },
                });

                if (error) {
                    console.error('Failed to create user:', error.message);
                    failedUsers.push(u.fullname || u.email);
                    continue; // Skip this user and continue with others
                }

                userId = newUser.user?.id;
                if (!userId) {
                    failedUsers.push(u.fullname || u.email);
                    continue; // Skip if we can't get user ID
                }
                if (!userId) {
                    return fail(500, { error: 'Failed to retrieve user ID from created account.' });
                }
            }

            const res = await addProfile(userId, u.fullname, u.email, u.phone || '', user.company_id, u.role || 'user', user.profile_id);

            if (!res) {
                console.error('Failed to create profile for user:', u.fullname);
                failedUsers.push(u.fullname || u.email);
            } else {
                successCount++;
            }
        }

        if (successCount === 0) {
            return fail(500, { error: `Failed to import any users. ${failedUsers.length > 0 ? 'Failed users: ' + failedUsers.join(', ') : ''}` });
        }

        let message = `Successfully imported ${successCount} users!`;
        if (failedUsers.length > 0) {
            message += ` (${failedUsers.length} failed: ${failedUsers.join(', ')})`;
        }

        return { success: message };
    },

    export: async ({ request, cookies }) => {
        console.log('Export action triggered');

        const formData = await request.formData();
        const format = formData.get('format');
        const data = cookies.get('user');
        if (!data) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }
        const user = JSON.parse(data);

        let profiles = await getProfilesByUser(user);

        if (!profiles || profiles.length === 0) {
            return fail(400, { error: 'No users available to export.' });
        }

        if (!format || (format !== 'csv' && format !== 'json' && format !== 'xml')) {
            return fail(400, { error: 'Invalid export format selected. Please choose CSV, JSON, or XML.' });
        }

        // Generate filename with timestamp and company ID for security policies
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('-', '');
        const filename = `users-export-${user.user_id}-${user.company}-${timestamp}.${format}`;
        const bucketName = 'exports'; // You'll need to create this bucket in Supabase

        let fileContent: string;
        let mimeType: string;

        if (format === 'csv') {
            const csvHeaders = ['Profile ID', 'Full Name', 'Role', 'Email', 'Phone'];
            const csvRows = profiles.map((profile: any) => [
                profile.profile_id,
                profile.fullname,
                profile.role,
                profile.email,
                profile.phone
            ]);

            fileContent = [
                csvHeaders.join(','),
                ...csvRows.map((row: any[]) => row.join(','))
            ].join('\n');
            mimeType = 'text/csv';

        } else if (format === 'json') {
            fileContent = JSON.stringify(profiles, null, 2);
            mimeType = 'application/json';

        } else if (format === 'xml') {
            fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<users>
    ${profiles.map((profile: any) => `
    <user>
        <profile_id>${profile.profile_id}</profile_id>
        <fullname>${profile.fullname}</fullname>
        <role>${profile.role}</role>
        <email>${profile.email}</email>
        <phone>${profile.phone}</phone>
    </user>`).join('')}
</users>`.trim();
            mimeType = 'application/xml';

        } else {
            return fail(400, { error: 'Invalid export format selected. Please choose CSV, JSON, or XML.' });
        }

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filename, fileContent, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return fail(500, { error: 'Failed to save export file. Please try again.' });
        }

        // Generate a signed URL for download (expires in 1 hour)
        const { data: urlData, error: urlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filename, 3600);

        if (urlError) {
            console.error('URL generation error:', urlError);
            return fail(500, { error: 'Failed to generate download link. Please try again.' });
        }

        return {
            success: `Export completed successfully! Your file contains ${profiles.length} users.`,
            downloadUrl: urlData.signedUrl,
            filename: filename
        };
    },

    // Edit user action
    edit: async ({ request, cookies }) => {
        const user = await getProfile()

        if (!user || user.role !== 'admin') {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const profile_id = formData.get('profile_id') as string;
        const fullname = formData.get('fullname') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const role = formData.get('role') as string;

        if (!profile_id || !fullname || !email || !phone || !role) {
            return fail(400, { error: 'Missing required fields' });
        }

        try {
            // Update user profile in database
            const updateMutation = `
                mutation ($profile_id: BigInt!, $fullname: String!, $email: String!, $phone: String!, $role: user_role!) {
                    updateprofilesCollection(
                        filter: { profile_id: { eq: $profile_id } }
                        set: {
                            fullname: $fullname,
                            email: $email,
                            phone: $phone,
                            role: $role
                        }
                    ) {
                        records {
                            fullname
                            email
                            phone
                            role
                        }
                    }
                }
            `;

            const result = await gql(updateMutation, {
                profile_id: parseInt(profile_id),
                fullname,
                email,
                phone,
                role
            });

            if (!result?.updateprofilesCollection?.records?.length) {
                return fail(500, { error: 'Failed to update user' });
            }

            return {
                success: `User ${fullname} updated successfully!`
            };

        } catch (err) {
            console.error('Edit user error:', err);
            return fail(500, { error: 'Failed to update user' });
        }
    },

    // Delete user action
    delete: async ({ request, cookies }) => {
        const user = await getProfile()

        if (!user || user.role !== 'admin') {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const fullname = formData.get('fullname') as string;

        if (!id) {
            return fail(400, { error: 'Missing user ID' });
        }

        try {
            // Delete user profile from database
            const deleteMutation = `
                mutation ($profile_id: BigInt!) {
                    deleteFromprofilesCollection(
                        filter: { profile_id: { eq: $profile_id } }
                    ) {
                        records {
                            profile_id
                            fullname
                        }
                    }
                }
            `;

            const result = await gql(deleteMutation, {
                id: parseInt(id)
            });

            if (!result?.deleteFromprofilesCollection?.records?.length) {
                return fail(500, { error: 'Failed to delete user' });
            }

            return {
                success: `User ${fullname || 'Unknown'} deleted successfully!`
            };

        } catch (err) {
            console.error('Delete user error:', err);
            return fail(500, { error: 'Failed to delete user' });
        }
    }
} satisfies Actions;