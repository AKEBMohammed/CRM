import { error, fail } from '@sveltejs/kit';
import { gql } from '$lib/graphql';
import type { Actions, PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async ({ params, cookies }) => {
    let data = cookies.get('user');
    if (!data) {
        throw error(401, 'Unauthorized');
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
        throw error(500, 'Failed to fetch profiles');
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
        const formData = await request.formData();
        const fullname = formData.get('fullname');
        const role = formData.get('role');
        const email = formData.get('email');
        const password = formData.get('password');
        const data = cookies.get('user');

        if (!data) {
            throw error(401, 'Unauthorized');
        }
        const user = JSON.parse(data);

        if (!fullname || !role || !email || !password) {
            throw error(400, 'Missing fields');
        }
        let mutationUser = await supabase.auth.admin.createUser({
            email: email.toString(),
            password: password.toString(),
        });

        if (mutationUser.error) {
            throw error(500, 'Failed to create user: ' + mutationUser.error.message);
        }

        let usersId = mutationUser.data.user?.id;
        if (!usersId) {
            throw error(500, 'Failed to get user ID');
        }

        let mutationProfile = `
        mutation {
            createProfile(
                input: {
                    fullname: "${fullname}",
                    role: "${role}",
                    company_id: "${user.company}",
                    user_id: "${usersId}"
                }
            ) {
                profile {
                    profile_id
                }
            }
        }
        `;

        const resProfile = await gql(mutationProfile);
        if (!resProfile) {
            throw error(500, 'Failed to create profile');
        }

        return { success: true };
    },

    import: async ({ request, cookies }) => {
        const formData = await request.formData();
        const file = formData.get('file');
        const data = cookies.get('user');

        if (!data) {
            throw error(401, 'Unauthorized');
        }
        const user = JSON.parse(data);

        if (!file || !(file instanceof File)) {
            throw error(400, 'No file uploaded');
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
                throw error(400, 'Unsupported file format. Please use JSON or CSV.');
            }
        } catch (e) {
            throw error(400, 'Invalid file format or corrupted data');
        }

        if (!Array.isArray(users)) {
            throw error(400, 'File should contain an array of users');
        }

        for (let u of users) {
            if (!u.fullname || !u.email) {
                continue; // Skip invalid entries
            }

            // Create user in Supabase Auth if user_id is not provided
            let userId = u.user_id;
            if (!userId) {
                const mutationUser = await supabase.auth.admin.createUser({
                    email: u.email,
                    password: Math.random().toString(36).slice(-8), // Generate random password
                });

                if (mutationUser.error) {
                    console.error('Failed to create user:', mutationUser.error.message);
                    continue; // Skip this user and continue with others
                }

                userId = mutationUser.data.user?.id;
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

        return { success: true };
    },

    export: async ({ request, cookies }) => {
        console.log('Export action triggered');
        
        const formData = await request.formData();
        const format = formData.get('format');
        const data = cookies.get('user');
        if (!data) {
            return fail(401, 'Unauthorized');
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
            return fail(500, 'Failed to fetch profiles');
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

        console.log('exported users:', users);

        if (format === 'csv') {
            const csvHeaders = ['Profile ID', 'Full Name', 'Role', 'Email'];
            const csvRows = users.map((user: any) => [
                user.profile_id,
                user.fullname,
                user.role,
                user.email
            ]);

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map((row: any[]) => row.join(','))
            ].join('\n');

            return new Response(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="users.csv"'
                }
            });
        } else if (format === 'json') {
            const jsonContent = JSON.stringify(users, null, 2);
            return new Response(jsonContent, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': 'attachment; filename="users.json"'
                }
            });
        } else if (format === 'xml') {
            const xmlContent = `
                <users>
                    ${users.map((user: any) => `
                        <user>
                            <profile_id>${user.profile_id}</profile_id>
                            <fullname>${user.fullname}</fullname>
                            <role>${user.role}</role>
                            <email>${user.email}</email>
                        </user>
                    `).join('')}
                </users>
            `.trim();

            return new Response(xmlContent, {
                headers: {
                    'Content-Type': 'application/xml',
                    'Content-Disposition': 'attachment; filename="users.xml"'
                }
            });
        } else {
            return fail(400, 'Invalid format');
        }
    }
} satisfies Actions;