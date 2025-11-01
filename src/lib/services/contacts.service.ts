import { supabase } from '$lib/supabase';

/*
 * IMPORTANT: Understanding Company IDs in CRM Context
 * 
 * - contacts.company_id = The company that the CONTACT belongs to (i.e., customer company)
 * - profiles.company_id = The company that the USER belongs to (i.e., our CRM user's company)
 * 
 * When we call getAll(user_company_id), we want contacts CREATED BY users from user_company_id,
 * NOT contacts where the contact's company_id equals user_company_id.
 * 
 * This is a CRM system where:
 * - Users belong to CRM companies (sales teams)
 * - Contacts belong to customer companies (prospects/clients)
 * - Users create and manage contacts from various customer companies
 */

export const contactsService = {
    // Get all contacts created by users from a specific company
    async getAll(user_company_id: number) {
        // First get all profile_ids from the user's company
        const { data: companyProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('profile_id')
            .eq('company_id', user_company_id);

        if (profilesError) throw profilesError;

        const profileIds = companyProfiles?.map(p => p.profile_id) || [];
        
        if (profileIds.length === 0) {
            return []; // No profiles in company, so no contacts
        }

        // Now get contacts created by any of these profiles
        const { data, error } = await supabase
            .from('contacts')
            .select(`
                *,
                contact_company:companies(name, industry)
            `)
            .in('created_by', profileIds)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get all contacts for a specific contact company
    async getByContactCompany(company_id: number) {
        const { data, error } = await supabase
            .from('contacts')
            .select(`
                *,
                contact_company:companies(name, industry)
            `)
            .eq('company_id', company_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get contacts created by a specific user
    async getByCreator(creator_profile_id: number) {
        const { data, error } = await supabase
            .from('contacts')
            .select(`
                *,
                contact_company:companies(name, industry)
            `)
            .eq('created_by', creator_profile_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get contact by ID
    async getById(contact_id: number) {
        const { data, error } = await supabase
            .from('contacts')
            .select(`
                *,
                creator:profiles!contacts_created_by_fkey(fullname, email),
                deals(deal_id, title, value, stage, probability),
                tasks(task_id, title, status, priority, due_date),
                interactions(interaction_id, type, note, created_at)
            `)
            .eq('contact_id', contact_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create contact
    async create(contact_data: {
        fullname: string;
        email?: string;
        phone?: string;
        address?: string;
        company_id: number;
        created_by: number;
    }) {
        const { data, error } = await supabase
            .from('contacts')
            .insert(contact_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update contact
    async update(contact_id: number, updates: Partial<{
        fullname: string;
        email: string;
        phone: string;
        address: string;
    }>) {
        const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('contact_id', contact_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete contact
    async delete(contact_id: number) {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('contact_id', contact_id);

        if (error) throw error;
        return true;
    },

    // Search contacts by name or email (within user's company contacts)
    async search(user_company_id: number, query: string) {
        // First get all profile_ids from the user's company
        const { data: companyProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('profile_id')
            .eq('company_id', user_company_id);

        if (profilesError) throw profilesError;

        const profileIds = companyProfiles?.map(p => p.profile_id) || [];
        
        if (profileIds.length === 0) {
            return []; // No profiles in company, so no contacts
        }

        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .in('created_by', profileIds)
            .or(`fullname.ilike.%${query}%,email.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get contact statistics for user's company
    async getStats(user_company_id: number) {
        // First get all profile_ids from the user's company
        const { data: companyProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('profile_id')
            .eq('company_id', user_company_id);

        if (profilesError) throw profilesError;

        const profileIds = companyProfiles?.map(p => p.profile_id) || [];
        
        if (profileIds.length === 0) {
            return { total: 0, newThisMonth: 0, growthRate: '0' };
        }

        const { data, error } = await supabase
            .from('contacts')
            .select('contact_id, created_at')
            .in('created_by', profileIds);

        if (error) throw error;

        const total = data?.length || 0;
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const newThisMonth = data?.filter(contact => 
            new Date(contact.created_at) >= thisMonth
        ).length || 0;

        return {
            total,
            newThisMonth,
            growthRate: total > 0 ? ((newThisMonth / total) * 100).toFixed(1) : '0'
        };
    }
};