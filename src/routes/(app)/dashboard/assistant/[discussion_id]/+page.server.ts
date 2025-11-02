import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { discussionsService, chatsService } from '$lib/services';
import { getProfile } from "$lib/supabase";

export const load: PageServerLoad = async ({ params, cookies }) => {
    const user = await getProfile();
    if (!user) {
        redirect(300, '/auth');
    }

    try {
        // Get the discussion and verify access
        const discussion = await discussionsService.getById(parseInt(params.discussion_id));
        
        if (!discussion) {
            console.error('Discussion not found');
            throw redirect(300, '/dashboard/assistant');
        }

        // Check if the user has access to this discussion
        if (discussion.profile_id !== user.profile_id) {
            console.error('User does not have access to this discussion');
            throw redirect(300, '/dashboard/assistant');
        }

        // Get chats for this discussion
        const chats = await chatsService.getAll(parseInt(params.discussion_id));

        return { 
            discussion: {
                discussion_id: discussion.discussion_id,
                name: discussion.name
            }, 
            chats: chats || [],
            user
        };

    } catch (error) {
        console.error('Error loading discussion:', error);
        throw redirect(300, '/dashboard/assistant');
    }
};

