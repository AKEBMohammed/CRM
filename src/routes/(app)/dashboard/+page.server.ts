import type { Action, Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { contactsService, dealsService, tasksService, profilesService } from '$lib/services';
import { getProfile, supabase } from '$lib/supabase';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = await getProfile();
	if (!user) {
		console.log('No user found, redirecting to auth');
		redirect(302, '/auth');
	}

	try {
		let users = [];

		if (user.role === 'admin') {
			// Admin can see all company users
			users = await profilesService.getAll(user.company_id) || [];
		} else {
			// Regular users only see themselves
			users = [user];
		}
		console.log('Users:', users);


		// Get contacts for the user's company
		const contacts = await contactsService.getAll(user.company_id);
		console.log('Contacts:', contacts);


		// Get tasks for the user
		const tasks = (await tasksService.getAll(user.profile_id, user.company_id))
			.filter(t => t.status !== 'completed' && t.status !== 'canceled')
			.sort((a, b) => {
				const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
				return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
			});
		console.log('Tasks:', tasks);

		//Get open Deals
		const deals = (await dealsService.getAll(user.company_id))
			.filter(d => d.status !== 'closed_won' && d.status !== 'closed_lost');
			
		console.log('Deals:', deals);

		// Get rooms data (simplified mock for now)
		const rooms = users.map(user => ({
			room_id: user.profile_id,
			name: user.fullname,
			fullname: user.fullname,
			message: 'No recent messages',
			unreadCount: 0
		}));

		return {
			users,
			contacts,
			tasks,
			deals,
			rooms,
			user, // Add user to return data
			stats: {
				contactsThisMonth: contacts?.filter(c => {
					const contactDate = new Date(c.created_at);
					const thisMonth = new Date();
					return contactDate.getMonth() === thisMonth.getMonth() && 
						   contactDate.getFullYear() === thisMonth.getFullYear();
				}).length || 0,
				totalInteractions: 0, // This could be enhanced later with interactions service
				interactionsThisWeek: 0, // This could be enhanced later with interactions service
				totalMessages: 0, // This could be enhanced later with messages service
				totalRooms: rooms?.length || 0,
				totalDeals: deals?.length || 0,
				totalDealsValue: deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0
			}
		};

	} catch (error) {
		console.error('Dashboard load error:', error);
		return {
			users: [],
			contacts: [],
			tasks: [],
			deals: [],
			rooms: [],
			user: null,
			stats: {
				contactsThisMonth: 0,
				totalInteractions: 0,
				interactionsThisWeek: 0,
				totalMessages: 0,
				totalRooms: 0,
				totalDeals: 0,
				totalDealsValue: 0
			}
		};
	}
};

export const actions = {
	createDiscussion: async ({ request, cookies }) => {
		const user = await getProfile();
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name');

		if (!name) {
			return fail(400, { error: 'Discussion name is required' });
		}

		try {
			// Create discussion using Supabase REST API
			const { data: discussion, error } = await supabase
				.from('discussions')
				.insert({
					name: name.toString(),
					profile_id: user.profile_id
				})
				.select()
				.single();

			if (error) {
				console.error('Error creating discussion:', error);
				return fail(500, { error: 'Failed to create discussion' });
			}

			return {
				success: true,
				discussion_id: discussion.discussion_id
			};

		} catch (error) {
			console.error('Create discussion error:', error);
			return fail(500, { error: 'Failed to create discussion' });
		}
	}
} satisfies Actions;