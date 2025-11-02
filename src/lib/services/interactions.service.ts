import { supabase } from '$lib/supabase';

export const interactionsService = {
    // Get all interactions created by users from a specific company
    async getAll(user_company_id?: number, profile_id?: number) {
        if (profile_id) {
            // Get interactions for specific user
            const { data, error } = await supabase
                .from('interactions')
                .select(`
                    *,
                    deal:deals(title, value, stage, contact:contacts(fullname))
                `)
                .eq('created_by', profile_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } else if (user_company_id) {
            // Get interactions for all users in the company
            const { data: companyProfiles, error: profilesError } = await supabase
                .from('profiles')
                .select('profile_id')
                .eq('company_id', user_company_id);

            if (profilesError) throw profilesError;

            const profileIds = companyProfiles?.map(p => p.profile_id) || [];
            
            if (profileIds.length === 0) {
                return [];
            }

            const { data, error } = await supabase
                .from('interactions')
                .select(`
                    *,
                    deal:deals(title, value, stage, contact:contacts(fullname))
                `)
                .in('created_by', profileIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }

        return [];
    },

    // Get interaction by ID
    async getById(interaction_id: number) {
        const { data, error } = await supabase
            .from('interactions')
            .select(`
                *,
                deal:deals(
                    title, 
                    value, 
                    stage, 
                    contact:contacts(fullname, email, phone)
                ),
                creator:profiles!created_by(fullname, email, role)
            `)
            .eq('interaction_id', interaction_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create interaction
    async create(interaction_data: {
        type: string;
        note: string;
        deal_id?: number;
        created_by: number;
    }) {
        const { data, error } = await supabase
            .from('interactions')
            .insert(interaction_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update interaction
    async update(interaction_id: number, updates: Partial<{
        type: string;
        note: string;
        deal_id: number;
    }>) {
        const { data, error } = await supabase
            .from('interactions')
            .update(updates)
            .eq('interaction_id', interaction_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete interaction
    async delete(interaction_id: number) {
        const { error } = await supabase
            .from('interactions')
            .delete()
            .eq('interaction_id', interaction_id);

        if (error) throw error;
        return true;
    },

    // Get interactions by type
    async getByType(company_id: number, type: string) {
        const { data, error } = await supabase
            .from('interactions')
            .select(`
                *,
                deal:deals(title, value, contact:contacts(fullname)),
                creator:profiles!created_by(fullname, company_id)
            `)
            .eq('creator.company_id', company_id)
            .eq('type', type)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get interactions for a specific deal
    async getByDeal(deal_id: number) {
        const { data, error } = await supabase
            .from('interactions')
            .select(`
                *,
                creator:profiles!created_by(fullname, email)
            `)
            .eq('deal_id', deal_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get recent interactions (last N days)
    async getRecent(company_id: number, days: number = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data, error } = await supabase
            .from('interactions')
            .select(`
                *,
                deal:deals(title, value, contact:contacts(fullname)),
                creator:profiles!created_by(fullname, company_id)
            `)
            .eq('creator.company_id', company_id)
            .gte('created_at', cutoffDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get interaction statistics
    async getStats(company_id: number) {
        const { data, error } = await supabase
            .from('interactions')
            .select(`
                type, 
                created_at,
                creator:profiles!created_by(company_id)
            `)
            .eq('creator.company_id', company_id);

        if (error) throw error;

        const total = data?.length || 0;
        
        // Group by type
        const byType = data?.reduce((acc: any, interaction) => {
            const type = interaction.type || 'other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {}) || {};

        // Get this week's interactions
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = data?.filter(interaction => 
            new Date(interaction.created_at) >= weekAgo
        ).length || 0;

        // Get this month's interactions
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const thisMonth = data?.filter(interaction => 
            new Date(interaction.created_at) >= monthAgo
        ).length || 0;

        return {
            total,
            thisWeek,
            thisMonth,
            byType,
            averagePerDay: total > 0 ? (total / 30).toFixed(1) : '0'
        };
    },

    // Get interaction timeline for analytics
    async getTimeline(company_id: number, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('interactions')
            .select(`
                type,
                created_at,
                deal:deals(title, value),
                creator:profiles!created_by(fullname, company_id)
            `)
            .eq('creator.company_id', company_id)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get analytics data for interactions
    async getAnalytics(user_company_id: number) {
        // First get all profile_ids from the user's company
        const { data: companyProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('profile_id')
            .eq('company_id', user_company_id);

        if (profilesError) throw profilesError;

        const profileIds = companyProfiles?.map(p => p.profile_id) || [];
        
        if (profileIds.length === 0) {
            return {
                total: 0,
                recent: [],
                byType: [],
                byMonth: []
            };
        }

        const { data: interactions, error } = await supabase
            .from('interactions')
            .select(`
                *,
                deal:deals(title, value, stage, contact:contacts(fullname))
            `)
            .in('created_by', profileIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const total = interactions?.length || 0;
        const recent = interactions?.slice(0, 10) || [];

        // Group by type
        const typeStats: { [key: string]: number } = {};
        interactions?.forEach(interaction => {
            const type = interaction.type || 'other';
            typeStats[type] = (typeStats[type] || 0) + 1;
        });
        const byType = Object.entries(typeStats).map(([type, count]) => ({ type, count }));

        // Group by month
        const monthStats: { [key: string]: number } = {};
        interactions?.forEach(interaction => {
            const month = new Date(interaction.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short'
            });
            monthStats[month] = (monthStats[month] || 0) + 1;
        });
        const byMonth = Object.entries(monthStats).map(([month, count]) => ({ month, count }));

        return {
            total,
            recent,
            byType,
            byMonth
        };
    }
};