import type { Action, Actions, PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';
import { redirect } from '@sveltejs/kit';
import { getProfile } from '$lib/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = await getProfile()
	if (!user) {
		console.log('No user found, redirecting to auth');
		throw redirect(302, '/auth');
	}

	try {
		// Fetch dashboard statistics using Supabase REST API
		const [
			{ data: profiles },
			{ data: rooms },
			{ data: recentMessages },
			{ data: contacts },
			{ data: interactions },
			{ data: tasks },
			{ data: deals }
		] = await Promise.all([
			// Team profiles
			supabase
				.from('profiles')
				.select('profile_id, fullname, role, created_at')
				.eq('company_id', user.company_id),

			// Company rooms
			supabase
				.from('rooms')
				.select('room_id, name, created_at, created_by')
				.eq('company_id', user.company_id),

			// Recent messages
			supabase
				.from('messages')
				.select(`
                    message_id,
                    content,
                    send_at,
                    profiles!messages_profile_id_fkey(fullname),
                    rooms(name)
                `)
				.eq('company_id', user.company_id)
				.order('send_at', { ascending: false })
				.limit(10),

			// Contacts count
			supabase
				.from('contacts')
				.select('contact_id, created_at')
				.eq('company_id', user.company_id),

			// Interactions count
			supabase
				.from('interactions')
				.select('interaction_id, created_at')
				.eq('company_id', user.company_id),

			// Tasks for current user
			supabase
				.from('tasks')
				.select('task_id, status, due_date, created_at')
				.or(`created_by.eq.${user.profile_id},assigned_to.eq.${user.profile_id}`),

			// Deals count
			supabase
				.from('deals')
				.select('deal_id, value, stage, created_at')
				.eq('company_id', user.company_id)
		]);


		// Calculate user role distribution
		const roleStats = (profiles || []).reduce((acc: any, profile: any) => {
			const role = profile.role || 'user';
			acc[role] = (acc[role] || 0) + 1;
			return acc;
		}, {});

		// Get recent users (last 7 days)
		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);

		const newUsersThisWeek = (profiles || []).filter((profile: any) =>
			new Date(profile.created_at) > weekAgo
		).length;

		// Calculate today's tasks
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const todaysTasks = (tasks || []).filter((task: any) => {
			const dueDate = task.due_date ? new Date(task.due_date) : null;
			return dueDate && dueDate >= today && dueDate < tomorrow;
		}).length;

		// Recent activity count (interactions + messages from this week)
		const recentInteractions = (interactions || []).filter((interaction: any) =>
			new Date(interaction.created_at) > weekAgo
		).length;

		const recentMessagesCount = (recentMessages || []).filter((message: any) =>
			new Date(message.send_at) > weekAgo
		).length;

		const recentActivities = recentInteractions + recentMessagesCount;

		// Monthly growth calculations
		const thisMonth = new Date();
		thisMonth.setDate(1);
		thisMonth.setHours(0, 0, 0, 0);

		const contactsThisMonth = (contacts || []).filter((contact: any) =>
			new Date(contact.created_at) >= thisMonth
		).length;

		const interactionsThisWeek = (interactions || []).filter((interaction: any) =>
			new Date(interaction.created_at) > weekAgo
		).length;

		const dashboardStats = {
			totalUsers: profiles?.length || 0,
			totalRooms: rooms?.length || 0,
			newUsersThisWeek,
			roleDistribution: roleStats,
			totalMessages: recentMessages?.length || 0,
			totalContacts: contacts?.length || 0,
			totalInteractions: interactions?.length || 0,
			todaysTasks,
			recentActivities,
			contactsThisMonth,
			interactionsThisWeek,
			totalDeals: deals?.length || 0,
			totalDealsValue: (deals || []).reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
		};

		console.log('Processed dashboard stats:', dashboardStats);

		return {
			user,
			stats: dashboardStats,
			recentMessages: (recentMessages || []).slice(0, 5),
			recentUsers: (profiles || []).slice(0, 5),
			dashboardMetrics: {
				contacts: contactsThisMonth,
				interactions: interactionsThisWeek,
				tasks: todaysTasks,
				activities: recentActivities
			}
		};
	} catch (error) {
		console.error('Dashboard data fetch error:', error);
		return {
			user,
			stats: {
				totalUsers: 0,
				totalRooms: 0,
				newUsersThisWeek: 0,
				roleDistribution: {},
				totalMessages: 0,
				totalContacts: 0,
				totalInteractions: 0,
				todaysTasks: 0,
				recentActivities: 0,
				contactsThisMonth: 0,
				interactionsThisWeek: 0,
				totalDeals: 0,
				totalDealsValue: 0
			},
			recentMessages: [],
			recentUsers: [],
			dashboardMetrics: {
				contacts: 0,
				interactions: 0,
				tasks: 0,
				activities: 0
			}
		};
	}
};

export const actions = {
	signout: async () => {
		await supabase.auth.signOut();
		redirect(304, '/auth')
	}
} satisfies Actions;