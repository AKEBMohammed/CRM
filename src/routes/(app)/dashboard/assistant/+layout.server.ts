import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { discussionsService } from '$lib/services';
import { getProfile } from '$lib/supabase';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const user = await getProfile();
    if (!user) {
        redirect(300, '/auth');
    }

    try {
        const discussions = await discussionsService.getByProfileId(user.profile_id);
        return {
            discussions: discussions || []
        };
    } catch (error) {
        console.error('Failed to fetch discussions:', error);
        return {
            discussions: []
        };
    }
};

