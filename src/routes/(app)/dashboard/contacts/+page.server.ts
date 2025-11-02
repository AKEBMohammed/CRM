import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { contactsService } from '$lib/services';
import { getProfile } from '$lib/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
    const user = await getProfile();
    
    if (!user) {
        redirect(300, '/auth');
    }

    try {
        const contacts = await contactsService.getAll(user.company_id);
        return { contacts: contacts || [] };
    } catch (error) {
        console.error('Failed to fetch contacts:', error);
        return { contacts: [] };
    }
};

export const actions = {
    add: async ({ request, cookies }) => {
        const user = await getProfile();
        
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

        try {
            const contact = await contactsService.create({
                fullname: String(fullname),
                email: String(email),
                phone: String(phone),
                address: String(address),
                company_id: user.company_id,
                created_by: user.profile_id
            });

            if (!contact) {
                return fail(500, { error: 'Failed to add contact. Please try again later.' });
            }

            return { success: 'Contact added successfully!' };
        } catch (error) {
            console.error('Add contact error:', error);
            return fail(500, { error: 'Failed to add contact. Please try again later.' });
        }
    },

    import: async ({ request, cookies }) => {
        const formData = await request.formData();
        const file = formData.get('file');
        const user = await getProfile();

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

            try {
                const contact = await contactsService.create({
                    fullname: String(c.fullname),
                    email: String(c.email),
                    phone: String(c.phone || ''),
                    address: String(c.address || ''),
                    company_id: user.company_id,
                    created_by: user.profile_id
                });

                if (!contact) {
                    console.error('Failed to create contact for:', c.fullname);
                    failedContacts.push(c.fullname || c.email);
                } else {
                    successCount++;
                }
            } catch (error) {
                console.error('Failed to create contact for:', c.fullname, error);
                failedContacts.push(c.fullname || c.email);
            }
        }

        if (successCount === 0) {
            return fail(500, { error: `Failed to import any contacts. ${failedContacts.length > 0 ? 'Failed contacts: ' + failedContacts.join(', ') : ''}` });
        }

        let message = `Successfully imported ${successCount} contacts!`;
        if (failedContacts.length > 0) {
            message += ` (${failedContacts.length} failed: ${failedContacts.join(', ')})`;
        }

        return { success: message };
    },

    export: async ({ request, cookies }) => {
        const formData = await request.formData();
        const format = formData.get('format');
        const user = await getProfile();
        
        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        try {
            const contacts = await contactsService.getAll(user.company_id);

            if (!contacts || contacts.length === 0) {
                return fail(500, { error: 'No contacts found to export.' });
            }

            if (!format || (format !== 'csv' && format !== 'json' && format !== 'xml')) {
                return fail(400, { error: 'Invalid export format selected. Please choose CSV, JSON, or XML.' });
            }

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `contacts-export-${user.company_id}-${timestamp}.${format}`;

            let fileContent: string = '';
            let mimeType: string = '';

            if (format === 'csv') {
                const csvHeaders = ['Contact ID', 'Full Name', 'Email', 'Phone', 'Address', 'Company', 'Created By'];
                const csvRows = contacts.map((contact: any) => [
                    contact.contact_id,
                    contact.fullname,
                    contact.email,
                    contact.phone,
                    contact.address,
                    contact.company?.name || 'Unknown',
                    contact.profiles?.fullname || 'Unknown'
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
        <contact_id>${contact.contact_id}</contact_id>
        <fullname>${contact.fullname}</fullname>
        <email>${contact.email}</email>
        <phone>${contact.phone}</phone>
        <address>${contact.address}</address>
        <company>${contact.company?.name || 'Unknown'}</company>
        <created_by>${contact.profiles?.fullname || 'Unknown'}</created_by>
    </contact>`).join('')}
</contacts>`.trim();
                mimeType = 'application/xml';
            }

            // For simplicity, return the file content directly
            // In production, you might want to use Supabase Storage
            return {
                success: `Export completed successfully! Your file contains ${contacts.length} contacts.`,
                fileContent,
                filename,
                mimeType
            };
        } catch (error) {
            console.error('Export error:', error);
            return fail(500, { error: 'Failed to export contacts. Please try again.' });
        }
    },

    // Edit contact action
    edit: async ({ request, cookies }) => {
        const user = await getProfile();

        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const contact_id = formData.get('id') as string;
        const fullname = formData.get('fullname') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const address = formData.get('address') as string;

        if (!contact_id || !fullname || !email || !phone) {
            return fail(400, { error: 'Missing required fields' });
        }

        try {
            const contact = await contactsService.update(parseInt(contact_id), {
                fullname,
                email,
                phone,
                address: address || ''
            });

            if (!contact) {
                return fail(500, { error: 'Failed to update contact' });
            }

            return {
                success: `Contact ${fullname} updated successfully!`
            };

        } catch (err) {
            console.error('Edit contact error:', err);
            return fail(500, { error: 'Failed to update contact' });
        }
    },
    
    // Delete contact action
    delete: async ({ request, cookies }) => {
        const user = await getProfile();

        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const fullname = formData.get('fullname') as string;

        if (!id) {
            return fail(400, { error: 'Missing contact ID' });
        }

        try {
            const success = await contactsService.delete(parseInt(id));

            if (!success) {
                return fail(500, { error: 'Failed to delete contact' });
            }

            return {
                success: `Contact ${fullname || 'Unknown'} deleted successfully!`
            };

        } catch (err) {
            console.error('Delete contact error:', err);
            return fail(500, { error: 'Failed to delete contact' });
        }
    }
} satisfies Actions;