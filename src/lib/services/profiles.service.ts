
import { supabase } from '$lib/supabase';

export const profilesService = {
    // Get all profiles for a company
    async getAll(company_id: number) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', company_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get profile by ID
    async getById(profile_id: number) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                company:companies!profiles_company_id_fkey(name, industry, room_id),
                added_by_profile:profiles!profiles_added_by_fkey(fullname, email)
            `)
            .eq('profile_id', profile_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Get profile by user_id (for authentication)
    async getByUserId(user_id: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                company:companies!profiles_company_id_fkey(name, industry, room_id)
            `)
            .eq('user_id', user_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create profile
    async create(profile_data: {
        user_id: string;
        fullname: string;
        email: string;
        phone?: string;
        company_id: number;
        role?: string;
        added_by?: number;
        avatar?: string;
    }) {
        const { data, error } = await supabase
            .from('profiles')
            .insert(profile_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update profile
    async update(profile_id: number, updates: Partial<{
        fullname: string;
        email: string;
        phone: string;
        role: string;
        avatar: string;
    }>) {
        const updatedData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('profiles')
            .update(updatedData)
            .eq('profile_id', profile_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete profile
    async delete(profile_id: number) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('profile_id', profile_id);

        if (error) throw error;
        return true;
    },

    // Get team statistics
    async getTeamStats(company_id: number) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                profile_id,
                fullname,
                role,
                created_at
            `)
            .eq('company_id', company_id);

        if (error) throw error;

        const total = data?.length || 0;
        const admins = data?.filter(profile => profile.role === 'admin').length || 0;
        const users = data?.filter(profile => profile.role === 'user').length || 0;

        return {
            total,
            admins,
            users,
            roleDistribution: { admin: admins, user: users },
            members: data || []
        };
    },

    // Get profile performance metrics
    async getPerformanceMetrics(profile_id: number) {
        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select('value, stage, created_at')
            .eq('profile_id', profile_id);

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('status, priority, created_at')
            .or(`assigned_to.eq.${profile_id},created_by.eq.${profile_id}`);

        const { data: interactions, error: interactionsError } = await supabase
            .from('interactions')
            .select('type, created_at')
            .eq('created_by', profile_id);

        if (dealsError || tasksError || interactionsError) {
            throw dealsError || tasksError || interactionsError;
        }

        const dealsCount = deals?.length || 0;
        const wonDeals = deals?.filter(deal => deal.stage === 'closed_won') || [];
        const dealsValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        const tasksCount = tasks?.length || 0;
        const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;

        const interactionsCount = interactions?.length || 0;

        return {
            deals: {
                total: dealsCount,
                won: wonDeals.length,
                value: dealsValue,
                conversionRate: dealsCount > 0 ? ((wonDeals.length / dealsCount) * 100).toFixed(1) : '0'
            },
            tasks: {
                total: tasksCount,
                completed: completedTasks,
                completionRate: tasksCount > 0 ? ((completedTasks / tasksCount) * 100).toFixed(1) : '0'
            },
            interactions: {
                total: interactionsCount
            }
        };
    },

    // Update role
    async updateRole(profile_id: number, role: string) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ 
                role,
                updated_at: new Date().toISOString()
            })
            .eq('profile_id', profile_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Search profiles
    async search(company_id: number, query: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', company_id)
            .or(`fullname.ilike.%${query}%,email.ilike.%${query}%`)
            .order('fullname');

        if (error) throw error;
        return data;
    }
};