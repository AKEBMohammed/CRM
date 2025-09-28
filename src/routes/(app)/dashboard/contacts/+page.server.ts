import { fail } from '@sveltejs/kit';
import { gql } from '$lib/graphql';
import type { Actions, PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';


async function addContact(contact: { fullname: string; email: string; phone: string; address: string; created_by: number }): Promise<boolean> {
    const mutation = `
        mutation ($fullname: String!, $email: String!, $phone: String!, $address: String!, $created_by: BigInt!) {
            insertIntocontactsCollection(
                objects: [{
                    fullname: $fullname,
                    email: $email,
                    phone: $phone,
                    address: $address,
                    created_by: $created_by
                }]
            ) {
                records {
                    fullname
                    email
                    phone
                    address
                    created_by
                }
            }
        }
    `;

    const res = await gql(mutation, {
        fullname: contact.fullname,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        created_by: contact.created_by
    });

    if (!res) {
        return false
    }

    return true;
}

async function getContactsByUser(user: { profile_id: number, fullname: string, role: string }): Promise<any[] | false> {
    let query = `
    query {
        contactsCollection${user.role === 'admin' ?
            '' : ` (filter: { created_by: { eq: "${user.profile_id}" } })`} {
            edges {
                node {
                    fullname
                    phone
                    email
                    address
                    contact_id
                    companies {
                        name
                    }
                    profiles {
                        fullname
                    }
                }
            }
        }
    }
    `;
    

    const result = await gql(query);
    if (!result) {
        return false;
    }


    let contacts = result
        .contactsCollection
        .edges
        .map((edge: any) => {
            return {
                contact_id: edge.node.contact_id,
                fullname: edge.node.fullname,
                email: edge.node.email,
                phone: edge.node.phone,
                address: edge.node.address,
                company: edge.node.companies ? edge.node.companies.name : 'Unknown',
                created_by: edge.node.profiles ? edge.node.profiles.fullname : user.fullname
            };
        });        

    return contacts;
}


export const load: PageServerLoad = async ({ params, cookies }) => {
    let user = JSON.parse(cookies.get('user') || 'null');
    if (!user) {
        return fail(401, { error: 'Unauthorized access. Please log in again.' });
    }

    const contacts = await getContactsByUser(user);
    if (!contacts) {
        return fail(500, { error: 'Failed to fetch contacts from database.' });
    }

    return { contacts };

};

export const actions = {
    add: async ({ request, cookies }) => {
        let user = JSON.parse(cookies.get('user') || 'null');
        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const fullname = formData.get('fullname');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const address = formData.get('address') || '';


        if (!fullname || !email || !phone) {
            return fail(400, { error: 'All fields are required. Please fill in all the information.' });
        }


        const result = await addContact({
            fullname: String(fullname),
            email: String(email),
            phone: String(phone),
            address: String(address),
            created_by: user.profile_id
        });
        if (!result) {
            return fail(500, { error: 'Failed to add contact. Please try again later.' });
        }

        return { success: 'Contact added successfully!' };
    },

    import: async ({ request, cookies }) => {
        const formData = await request.formData();
        const file = formData.get('file');
        const user = JSON.parse(cookies.get('user') || 'null');

        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        if (!file || !(file instanceof File)) {
            return fail(400, { error: 'No file uploaded. Please select a file to import.' });
        }

        const text = await file.text();
        let contacts;

        try {
            if (file.name.endsWith('.json')) {
                contacts = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                // Parse CSV
                const lines = text.trim().split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                contacts = [];

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
                        email: user_obj.email,
                        phone: user_obj.phone || '',
                        address: user_obj.address || '',
                    };

                    if (mappedUser.fullname && mappedUser.email) {
                        contacts.push(mappedUser);
                    }
                }
            } else {
                return fail(400, { error: 'Unsupported file format. Please use JSON or CSV files only.' });
            }
        } catch (e) {
            return fail(400, { error: 'Invalid file format or corrupted data. Please check your file and try again.' });
        }

        if (!Array.isArray(contacts)) {
            return fail(400, { error: 'File should contain an array of contacts. Please check the file format.' });
        }

        let successCount = 0;
        let failedContacts: string[] = [];

        for (let c of contacts) {
            if (!c.fullname || !c.email) {
                console.warn('Skipping contact with missing fullname or email:', c);
                failedContacts.push(c.fullname || c.email || 'Unknown contact');
                continue;
            }



            const res = await addContact({
                fullname: String(c.fullname),
                email: String(c.email),
                phone: String(c.phone || ''),
                address: String(c.address || ''),
                created_by: user.profile_id
            });

            if (!res) {
                console.error('Failed to create profile for user:', c.fullname);
                failedContacts.push(c.fullname || c.email);
            } else {
                successCount++;
            }
        }

        if (successCount === 0) {
            return fail(500, { error: `Failed to import any users. ${failedContacts.length > 0 ? 'Failed users: ' + failedContacts.join(', ') : ''}` });
        }

        let message = `Successfully imported ${successCount} users!`;
        if (failedContacts.length > 0) {
            message += ` (${failedContacts.length} failed: ${failedContacts.join(', ')})`;
        }

        return { success: message };
    },

    export: async ({ request, cookies }) => {
        const formData = await request.formData();
        const format = formData.get('format');
        const user = JSON.parse(cookies.get('user') || 'null');
        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }


        let contacts = await getContactsByUser(user);

        if (!contacts || contacts.length === 0) {
            return fail(500, { error: 'Failed to fetch user profiles for export.' });
        }


        if (!format || (format !== 'csv' && format !== 'json' && format !== 'xml')) {
            return fail(400, { error: 'Invalid export format selected. Please choose CSV, JSON, or XML.' });
        }

        // Generate filename with timestamp and company ID for security policies
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('-', '');
        const filename = `contacts-export-${user.user_id}-${user.company}-${timestamp}.${format}`;
        const bucketName = 'exports'; // You'll need to create this bucket in Supabase

        let fileContent: string;
        let mimeType: string;

        if (format === 'csv') {
            const csvHeaders = ['Profile ID', 'Full Name', 'Email', 'Phone', 'Address', 'Created By'];
            const csvRows = contacts.map((contact: any) => [
                contact.contact_id,
                contact.fullname,
                contact.email,
                contact.phone,
                contact.address,
                contact.created_by
            ]);

            fileContent = [
                csvHeaders.join(','),
                ...csvRows.map((row: any[]) => row.join(','))
            ].join('\n');
            mimeType = 'text/csv';

        } else if (format === 'json') {
            fileContent = JSON.stringify(contacts, null, 2);
            mimeType = 'application/json';

        } else if (format === 'xml') {
            fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<contacts>
    ${contacts.map((contact: any) => `
    <contact>
        <profile_id>${contact.contact_id}</profile_id>
        <fullname>${contact.fullname}</fullname>
        <email>${contact.email}</email>
        <phone>${contact.phone}</phone>
        <address>${contact.address}</address>
        <created_by>${contact.created_by}</created_by>
    </contact>`).join('')}
</contacts>`.trim();
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
            success: `Export completed successfully! Your file contains ${contacts.length} contacts.`,
            downloadUrl: urlData.signedUrl,
            filename: filename
        };
    }
} satisfies Actions;