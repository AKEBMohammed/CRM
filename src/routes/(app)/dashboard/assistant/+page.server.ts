import { discussionsService } from '$lib/services';
import { getProfile } from "$lib/supabase";
import { redirect, type Actions } from "@sveltejs/kit";

export const actions = {
    create: async ({ request, cookies }) => {
        const user = await getProfile();
        if (!user) {
            throw redirect(300, '/auth');
        }

        try {
            const discussion = await discussionsService.create({
                profile_id: user.profile_id,
                name: "New Discussion"
            });

            throw redirect(300, `/dashboard/assistant/${discussion.discussion_id}`);
        } catch (error) {
            console.error('Failed to create discussion:', error);
            throw redirect(300, '/dashboard/assistant');
        }
    }
} satisfies Actions;