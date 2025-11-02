import { supabase } from '$lib/supabase';

export const companiesService = {
    // Get all companies
    async getAll() {
        const { data, error } = await supabase
            .from('companies')
            .select('*, room:rooms(*), creator:profiles!created_by(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get company by ID
    async getById(company_id:number) {
        const { data, error } = await supabase
            .from('companies')
            .select('*, room:rooms(*), creator:profiles!created_by(*)')
            .eq('company_id', company_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create company
    async create(company_data: { name: string; created_by: string }) {
        const { data, error } = await supabase
            .from('companies')
            .insert(company_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update company
    async update(company_id: number, updates: Partial<{ name: string; created_by: string }>) {
        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('company_id', company_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete company
    async delete(company_id: number) {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('company_id', company_id);

        if (error) throw error;
        return true;
    },

    // Get contacts for a company
    async getContacts(company_id: number) {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('company_id', company_id);

        if (error) throw error;
        return data;
    }
};