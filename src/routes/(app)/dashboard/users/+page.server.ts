import { error, fail } from '@sveltejs/kit';
import { gql } from '$lib/graphql';
import type { Actions, PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ params, cookies }) => {
    let data = cookies.get('user');
    if (!data) {
        return fail(401, { error: 'Unauthorized access. Please log in again.' });
    }
    const user = JSON.parse(data);

    let query = `
    query {
        profilesCollection(
            filter: {  company_id: { eq: "${user.company}" } }
        ) {
            edges {
                node {
                    profile_id
                    fullname
                    role
                    users {
                        email
                    }
                }
            }
        }
    }
    `;

    const res = await gql(query);
    if (!res) {
        return fail(500, { error: 'Failed to fetch user profiles from database.' });
    }

    let users = res
        .profilesCollection
        .edges
        .map((edge: any) => {
            return {
                email: edge.node.users?.email || 'N/A',
                ...edge.node,
            };
        });

    return { users };

};

export const actions = {
    add: async ({ request, cookies }) => {
        console.log('Adding a user');

        const formData = await request.formData();
        const fullname = formData.get('fullname');
        const role = formData.get('role');
        const email = formData.get('email');
        const password = formData.get('password');
        const data = cookies.get('user');

        if (!data) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }
        const user = JSON.parse(data);

        if (!fullname || !role || !email || !password) {
            return fail(400, { error: 'All fields are required. Please fill in all the information.' });
        }

        const baseUrl = PUBLIC_BASE_URL || 'http://localhost:5173';
        const emailRedirectTo = `${baseUrl}/dashboard`;
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

        const mutationProfile = `
            mutation ($fullname: String!, $role: user_role!, $company_id: BigInt, $user_id: UUID!) {
                insertIntoprofilesCollection(
                objects: [{
                    fullname: $fullname,
                    role: $role,
                    company_id: $company_id,
                    user_id: $user_id
                }]
                ) {
                records {
                    fullname
                    role
                    company_id
                    user_id
                }
                }
            }
`;

        const resProfile = await gql(mutationProfile, {
            fullname: fullname,
            role: role,
            company_id: user.company,
            user_id: userId
        });

        //const resProfile = await gql(mutationProfile);
        if (!resProfile) {
            return fail(500, { error: 'Failed to create user profile in database.' });
        }

        return { success: 'User added successfully!' };
    },

    import: async ({ request, cookies }) => {
        const formData = await request.formData();
        const file = formData.get('file');
        const data = cookies.get('user');

        if (!data) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }
        const user = JSON.parse(data);

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

        for (let u of users) {
            if (!u.fullname || !u.email) {
                continue; // Skip invalid entries
            }

            // Create user in Supabase Auth if user_id is not provided
            let userId = u.user_id;
            if (!userId) {
                const newUser = await supabase.auth.admin.createUser({
                    email: u.email,
                    password: Math.random().toString(36).slice(-8), // Generate random password
                });

                if (newUser.error) {
                    console.error('Failed to create user:', newUser.error.message);
                    continue; // Skip this user and continue with others
                }

                userId = newUser.data.user?.id;
                if (!userId) {
                    continue; // Skip if we can't get user ID
                }
            }

            let mutation = `
            mutation {
                createProfile(
                    input: {
                        fullname: "${u.fullname}",
                        role: "${u.role || 'user'}",
                        company_id: "${user.company}",
                        user_id: "${userId}"
                    }
                ) {
                    profile {
                        profile_id
                    }
                }
            }
            `;

            const res = await gql(mutation);
            if (!res) {
                console.error('Failed to create profile for user:', u.fullname);
            }
        }

        return { success: `Successfully imported ${users.length} users!` };
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

        let query = `
        query {
            profilesCollection(
                filter: {  company_id: { eq: "${user.company}" } }
            ) {
                edges {
                    node {
                        profile_id
                        fullname
                        role
                        users {
                            email
                        }
                    }
                }
            }
        }
        `;

        const res = await gql(query);
        if (!res) {
            return fail(500, { error: 'Failed to fetch user profiles for export.' });
        }

        let users = res
            .profilesCollection
            .edges
            .map((edge: any) => {
                return {
                    email: edge.node.users?.email || 'N/A',
                    ...edge.node,
                };
            });

        if (users.length === 0) {
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
            const csvHeaders = ['Profile ID', 'Full Name', 'Role', 'Email'];
            const csvRows = users.map((user: any) => [
                user.profile_id,
                user.fullname,
                user.role,
                user.email
            ]);

            fileContent = [
                csvHeaders.join(','),
                ...csvRows.map((row: any[]) => row.join(','))
            ].join('\n');
            mimeType = 'text/csv';

        } else if (format === 'json') {
            fileContent = JSON.stringify(users, null, 2);
            mimeType = 'application/json';

        } else if (format === 'xml') {
            fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<users>
    ${users.map((user: any) => `
    <user>
        <profile_id>${user.profile_id}</profile_id>
        <fullname>${user.fullname}</fullname>
        <role>${user.role}</role>
        <email>${user.email}</email>
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
            success: `Export completed successfully! Your file contains ${users.length} users.`, 
            downloadUrl: urlData.signedUrl,
            filename: filename
        };
    }
} satisfies Actions;