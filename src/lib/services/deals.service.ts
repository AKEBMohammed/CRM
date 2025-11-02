import { supabase } from '$lib/supabase';

export const dealsService = {
    // Get all deals managed by users from a specific company
    async getAll(user_company_id: number) {
        // First get all profile_ids from the user's company
        const { data: companyProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('profile_id')
            .eq('company_id', user_company_id);

        if (profilesError) throw profilesError;

        const profileIds = companyProfiles?.map(p => p.profile_id) || [];
        
        if (profileIds.length === 0) {
            return []; // No profiles in company, so no deals
        }

        // Now get deals managed by any of these profiles
        const { data, error } = await supabase
            .from('deals')
            .select(`
                *,
                contact:contacts(fullname, email, phone),
                product:products(name, unit_price)
            `)
            .in('profile_id', profileIds)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get deal by ID
    async getById(deal_id: number) {
        const { data, error } = await supabase
            .from('deals')
            .select(`
                *,
                contact:contacts(fullname, email, phone, address),
                product:products(name, description, unit_price),
                owner:profiles!profile_id(fullname, email, role),
                interactions(interaction_id, type, note, created_at),
                tasks(task_id, title, description, status, priority, due_date)
            `)
            .eq('deal_id', deal_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create deal
    async create(deal_data: {
        title: string;
        value?: number;
        stage?: string;
        probability?: number;
        profile_id: number;
        contact_id?: number;
        product_id?: number;
    }) {
        const { data, error } = await supabase
            .from('deals')
            .insert(deal_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update deal
    async update(deal_id: number, updates: Partial<{
        title: string;
        value: number;
        stage: string;
        probability: number;
        contact_id: number;
        product_id: number;
    }>) {
        const updatedData = {
            ...updates,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('deals')
            .update(updatedData)
            .eq('deal_id', deal_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete deal
    async delete(deal_id: number) {
        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('deal_id', deal_id);

        if (error) throw error;
        return true;
    },

    // Get deals by stage
    async getByStage(company_id: number, stage: string) {
        const { data, error } = await supabase
            .from('deals')
            .select(`
                *,
                contact:contacts(fullname, email),
                product:products(name, unit_price),
                owner:profiles!profile_id(fullname)
            `)
            .eq('contacts.company_id', company_id)
            .eq('stage', stage)
            .order('value', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get deals by owner
    async getByOwner(profile_id: number) {
        const { data, error } = await supabase
            .from('deals')
            .select(`
                *,
                contact:contacts(fullname, email, company_id),
                product:products(name, unit_price)
            `)
            .eq('profile_id', profile_id)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get deal pipeline statistics for user's company
    async getPipelineStats(user_company_id: number) {
        // First get all profile_ids from the user's company
        const { data: companyProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('profile_id')
            .eq('company_id', user_company_id);

        if (profilesError) throw profilesError;

        const profileIds = companyProfiles?.map(p => p.profile_id) || [];
        
        if (profileIds.length === 0) {
            return {
                pipeline: [],
                summary: {
                    totalDeals: 0,
                    totalValue: 0,
                    wonDeals: 0,
                    wonValue: 0,
                    conversionRate: '0'
                }
            };
        }

        const { data, error } = await supabase
            .from('deals')
            .select('stage, value, probability, created_at')
            .in('profile_id', profileIds);

        if (error) throw error;

        const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
        const pipeline = stages.map(stage => {
            const stageDeals = data?.filter(deal => deal.stage === stage) || [];
            const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            const count = stageDeals.length;

            return {
                stage,
                count,
                totalValue,
                averageValue: count > 0 ? totalValue / count : 0
            };
        });

        const totalValue = data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
        const totalDeals = data?.length || 0;
        const wonDeals = data?.filter(deal => deal.stage === 'closed_won') || [];
        const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        return {
            pipeline,
            summary: {
                totalDeals,
                totalValue,
                wonDeals: wonDeals.length,
                wonValue,
                conversionRate: totalDeals > 0 ? ((wonDeals.length / totalDeals) * 100).toFixed(1) : '0'
            }
        };
    },

    // Update deal stage
    async updateStage(deal_id: number, stage: string, probability?: number) {
        const updates: any = { 
            stage, 
            updated_at: new Date().toISOString() 
        };
        
        if (probability !== undefined) {
            updates.probability = probability;
        }

        const { data, error } = await supabase
            .from('deals')
            .update(updates)
            .eq('deal_id', deal_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get analytics data for deals
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
                totalValue: 0,
                pipeline: [],
                byStage: [],
                recentWins: [],
                topDeals: []
            };
        }

        const { data: deals, error } = await supabase
            .from('deals')
            .select(`
                *,
                contact:contacts(fullname, email),
                product:products(name, unit_price)
            `)
            .in('profile_id', profileIds)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const total = deals?.length || 0;
        const totalValue = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

        // Pipeline analysis
        const pipeline = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].map(stage => ({
            stage,
            count: deals?.filter(deal => deal.stage === stage).length || 0,
            value: deals?.filter(deal => deal.stage === stage)
                .reduce((sum, deal) => sum + (deal.value || 0), 0) || 0
        }));

        // By stage analysis
        const stageStats: { [key: string]: { count: number, value: number } } = {};
        deals?.forEach(deal => {
            const stage = deal.stage || 'unknown';
            if (!stageStats[stage]) stageStats[stage] = { count: 0, value: 0 };
            stageStats[stage].count++;
            stageStats[stage].value += deal.value || 0;
        });
        const byStage = Object.entries(stageStats).map(([stage, data]) => ({ stage, ...data }));

        // Recent wins
        const recentWins = deals?.filter(deal => deal.stage === 'closed_won')
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 5) || [];

        // Top deals
        const topDeals = deals?.filter(deal => deal.stage !== 'closed_lost')
            .sort((a, b) => (b.value || 0) - (a.value || 0))
            .slice(0, 10) || [];

        return {
            total,
            totalValue,
            pipeline,
            byStage,
            recentWins,
            topDeals
        };
    }
};