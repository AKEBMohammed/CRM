import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { 
    companiesService, 
    contactsService, 
    dealsService, 
    interactionsService, 
    productsService, 
    tasksService, 
    profilesService, 
    messagesService 
} from "$lib/services";
import { getProfile } from "$lib/supabase";

export const load: PageServerLoad = async ({ cookies }) => {
    const user = await getProfile();
    if (!user) {
        redirect(300, '/auth');
    }

    console.log('✅ User authenticated:', user);
    console.log('🏢 Company ID:', user.company_id);
    console.log('👤 Profile ID:', user.profile_id);

    try {
        // Use services to fetch all data
        const [
            company,
            contacts,
            deals,
            interactions,
            products,
            tasks,
            team
        ] = await Promise.all([
            // Company data
            companiesService.getById(user.company_id),

            // Contacts data
            contactsService.getAll(user.company_id),

            // Deals data
            dealsService.getAll(user.company_id),

            // Interactions data
            interactionsService.getAll(user.company_id),

            // Products data
            productsService.getAll(user.company_id),

            // Tasks data
            tasksService.getAll(user.profile_id, user.company_id),

            // Team data
            profilesService.getAll(user.company_id)
        ]);

        // Get messages data using company's room_id
        const messages = await messagesService.getUnreadCount(company?.room_id || 21, user.profile_id);

        console.log('Raw data fetched:', {
            company: company ? 'found' : 'null',
            contacts: contacts?.length || 0,
            deals: deals?.length || 0,
            interactions: interactions?.length || 0,
            products: products?.length || 0,
            tasks: tasks?.length || 0,
            team: team?.length || 0,
            messages: messages || 0
        });

        // Process and enhance the data for analytics using services data
        const analytics = {
            company: company || null,

            // Contacts metrics
            contacts: {
                total: contacts?.length || 0,
                recent: contacts?.slice(0, 10) || [],
                byMonth: processContactsByMonth(contacts || []),
                byCreator: processContactsByCreator(contacts || [])
            },

            // Deals metrics - get detailed deals with relationships
            deals: await dealsService.getAnalytics(user.company_id),

            // Interactions metrics - get detailed interactions with relationships
            interactions: await interactionsService.getAnalytics(user.company_id),

            // Products metrics - get detailed products with analytics
            products: await productsService.getAnalytics(user.company_id),

            // Tasks metrics - get detailed tasks with relationships
            tasks: await tasksService.getAnalytics(user.profile_id, user.company_id),

            // Team performance
            team: {
                total: team?.length || 0,
                active: team?.filter(t => t.is_active)?.length || 0,
                members: team || [],
                byRole: processTeamByRole(team || []),
                topPerformers: getTopPerformers(team || [], deals || [])
            },

            // Messages metrics
            messages: {
                unreadCount: messages || 0,
                totalToday: 0 // Could be enhanced later
            }
        };

        console.log('Processed analytics:', {
            contacts: analytics.contacts.total,
            deals: analytics.deals?.total || 0,
            tasks: analytics.tasks?.total || 0,
            team: analytics.team.total
        });

        return { analytics, user };

    } catch (error) {
        console.error('Error fetching analytics:', error);

        return {
            analytics: {
                company: null,
                contacts: { total: 0, recent: [], byMonth: [], byCreator: [] },
                deals: { total: 0, totalValue: 0, pipeline: [], byStage: [], recentWins: [], topDeals: [] },
                interactions: { total: 0, recent: [], byType: [], byMonth: [] },
                products: { total: 0, totalValue: 0, recent: [], list: [], topPerforming: [] },
                tasks: { 
                    total: 0, 
                    completed: 0,
                    pending: 0, 
                    overdue: [], 
                    upcoming: [],
                    byStatus: [],
                    byPriority: [],
                    completionRate: "0%"
                },
                team: { 
                    total: 0, 
                    active: 0,
                    members: [],
                    byRole: [],
                    topPerformers: []
                },
                messages: { unreadCount: 0, totalToday: 0 }
            },
            user
        };
    }
};

// Helper functions for data processing
function processContactsByMonth(contacts: any[]) {
    const months: { [key: string]: number } = {};
    contacts.forEach(contact => {
        const month = new Date(contact.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short'
        });
        months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
}

function processContactsByCreator(contacts: any[]) {
    const creators: { [key: string]: number } = {};
    contacts.forEach(contact => {
        const creator = contact.created_by || 'Unknown';
        creators[creator] = (creators[creator] || 0) + 1;
    });
    return Object.entries(creators).map(([creator, count]) => ({ creator, count }));
}

function calculateTotalDealsValue(deals: any[]) {
    return deals.reduce((total, deal) => total + (deal.value || 0), 0);
}

function processDealsPipeline(deals: any[]) {
    const pipeline = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    return pipeline.map(stage => ({
        stage,
        count: deals.filter(deal => deal.stage === stage).length,
        value: deals.filter(deal => deal.stage === stage)
            .reduce((sum, deal) => sum + (deal.value || 0), 0)
    }));
}

function processDealsByStage(deals: any[]) {
    const stages: { [key: string]: { count: number, value: number } } = {};
    deals.forEach(deal => {
        const stage = deal.stage || 'unknown';
        if (!stages[stage]) stages[stage] = { count: 0, value: 0 };
        stages[stage].count++;
        stages[stage].value += deal.value || 0;
    });
    return Object.entries(stages).map(([stage, data]) => ({ stage, ...data }));
}

function getRecentWins(deals: any[]) {
    return deals
        .filter(deal => deal.stage === 'closed_won')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);
}

function getTopDeals(deals: any[]) {
    return deals
        .filter(deal => deal.stage !== 'closed_lost')
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 10);
}

function processInteractionsByType(interactions: any[]) {
    const types: { [key: string]: number } = {};
    interactions.forEach(interaction => {
        const type = interaction.type || 'other';
        types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
}

function processInteractionsByMonth(interactions: any[]) {
    const months: { [key: string]: number } = {};
    interactions.forEach(interaction => {
        const month = new Date(interaction.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short'
        });
        months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
}

function calculateProductsValue(products: any[]) {
    return products.reduce((total, product) => total + (product.unit_price || 0), 0);
}

function getTopPerformingProducts(deals: any[]) {
    const productPerformance: { [key: string]: { sales: number, revenue: number, name: string } } = {};

    deals.forEach(deal => {
        if (deal.products && deal.stage === 'closed_won') {
            const productName = deal.products.name;
            if (!productPerformance[productName]) {
                productPerformance[productName] = { sales: 0, revenue: 0, name: productName };
            }
            productPerformance[productName].sales++;
            productPerformance[productName].revenue += deal.value || 0;
        }
    });

    return Object.values(productPerformance)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
}

function processTasksByStatus(tasks: any[]) {
    const statuses: { [key: string]: number } = {};
    tasks.forEach(task => {
        const status = task.status || 'unknown';
        statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([status, count]) => ({ status, count }));
}

function processTasksByPriority(tasks: any[]) {
    const priorities: { [key: string]: number } = {};
    tasks.forEach(task => {
        const priority = task.priority || 'medium';
        priorities[priority] = (priorities[priority] || 0) + 1;
    });
    return Object.entries(priorities).map(([priority, count]) => ({ priority, count }));
}

function getOverdueTasks(tasks: any[]) {
    const today = new Date();
    return tasks
        .filter(task => {
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            return dueDate && dueDate < today && task.status !== 'completed';
        });
}

function getUpcomingTasks(tasks: any[]) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return tasks
        .filter(task => {
            const dueDate = task.due_date ? new Date(task.due_date) : null;
            return dueDate && dueDate >= today && dueDate <= nextWeek && task.status !== 'completed';
        })
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 10);
}

function getTopPerformers(team: any[], deals: any[]) {
    return team
        .map(member => ({
            ...member,
            dealsCount: deals.filter(deal => deal.profile_id === member.profile_id).length,
            dealsValue: deals.filter(deal => deal.profile_id === member.profile_id)
                .reduce((sum, deal) => sum + (deal.value || 0), 0)
        }))
        .sort((a, b) => b.dealsValue - a.dealsValue)
        .slice(0, 5);
}

function processMessageActivity(messages: any[]) {
    const days: { [key: string]: number } = {};
    messages.forEach(message => {
        const day = new Date(message.send_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
        days[day] = (days[day] || 0) + 1;
    });
    return Object.entries(days)
        .map(([day, count]) => ({ day, count }))
        .slice(-7); // Last 7 days
}

function processTeamByRole(team: any[]) {
    const roles: { [key: string]: number } = {};
    team.forEach(member => {
        const role = member.role || 'user';
        roles[role] = (roles[role] || 0) + 1;
    });
    return Object.entries(roles).map(([role, count]) => ({ role, count }));
}