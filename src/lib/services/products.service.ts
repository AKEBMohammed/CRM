import { supabase } from '$lib/supabase';

export const productsService = {
    // Get all products for a company
    async getAll(company_id: number) {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                creator:profiles!created_by(fullname, email),
                deals(deal_id, title, value, stage)
            `)
            .eq('creator.company_id', company_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get product by ID
    async getById(product_id: number) {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                creator:profiles!created_by(fullname, email, company_id),
                deals(deal_id, title, value, stage, probability, created_at)
            `)
            .eq('product_id', product_id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create product
    async create(product_data: {
        name: string;
        description?: string;
        unit_price?: number;
        created_by: number;
    }) {
        const { data, error } = await supabase
            .from('products')
            .insert(product_data)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update product
    async update(product_id: number, updates: Partial<{
        name: string;
        description: string;
        unit_price: number;
    }>) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('product_id', product_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete product
    async delete(product_id: number) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('product_id', product_id);

        if (error) throw error;
        return true;
    },

    // Search products by name
    async search(company_id: number, query: string) {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                creator:profiles!created_by(fullname, company_id)
            `)
            .eq('creator.company_id', company_id)
            .ilike('name', `%${query}%`)
            .order('name');

        if (error) throw error;
        return data;
    },

    // Get product performance statistics
    async getPerformanceStats(product_id: number) {
        const { data: deals, error } = await supabase
            .from('deals')
            .select('value, stage, created_at')
            .eq('product_id', product_id);

        if (error) throw error;

        const totalDeals = deals?.length || 0;
        const wonDeals = deals?.filter(deal => deal.stage === 'closed_won') || [];
        const revenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const averageDealValue = wonDeals.length > 0 ? revenue / wonDeals.length : 0;

        return {
            totalDeals,
            wonDeals: wonDeals.length,
            revenue,
            averageDealValue,
            conversionRate: totalDeals > 0 ? ((wonDeals.length / totalDeals) * 100).toFixed(1) : '0'
        };
    },

    // Get top performing products for a company
    async getTopPerforming(company_id: number, limit: number = 5) {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                creator:profiles!created_by(company_id),
                deals(value, stage)
            `)
            .eq('creator.company_id', company_id);

        if (error) throw error;

        // Calculate performance metrics for each product
        const productsWithStats = data?.map(product => {
            const deals = product.deals || [];
            const wonDeals = deals.filter((deal: any) => deal.stage === 'closed_won');
            const revenue = wonDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);

            return {
                ...product,
                dealsCount: deals.length,
                wonDealsCount: wonDeals.length,
                revenue,
                conversionRate: deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
            };
        }) || [];

        // Sort by revenue and return top performers
        return productsWithStats
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    },

    // Get analytics data for products
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
                recent: [],
                topPerforming: []
            };
        }

        const { data: products, error } = await supabase
            .from('products')
            .select(`
                *,
                deals(value, stage)
            `)
            .in('created_by', profileIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const total = products?.length || 0;
        const totalValue = products?.reduce((sum, product) => sum + (product.unit_price || 0), 0) || 0;
        const recent = products?.slice(0, 10) || [];

        // Calculate top performing products based on deals
        const topPerforming = products?.map(product => {
            const productDeals = product.deals || [];
            const wonDeals = productDeals.filter((deal: any) => deal.stage === 'closed_won');
            const revenue = wonDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
            
            return {
                ...product,
                dealsCount: productDeals.length,
                wonDealsCount: wonDeals.length,
                revenue,
                conversionRate: productDeals.length > 0 ? (wonDeals.length / productDeals.length) * 100 : 0
            };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5) || [];

        return {
            total,
            totalValue,
            recent,
            list: products || [], // Add the list property that frontend expects
            topPerforming
        };
    }
};