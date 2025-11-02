import { discussionsService } from '$lib/services';
import { getProfile } from "$lib/supabase";
import { redirect, type Actions } from "@sveltejs/kit";

export const actions = {
    create: async ({ request, cookies }) => {
        const user = await getProfile();
        if (!user) {
            redirect(300, '/auth');
        }

        console.log('Start creating disscussion.');
        
        let discussionId;

        try {
            const discussion = await discussionsService.create({
                profile_id: user.profile_id,
                name: "New Discussion"
            });

            console.log('Discussion created successfully : ID => ', discussion.discussion_id);
            discussionId = discussion.discussion_id;
        } catch (error) {
            console.error('Failed to create discussion:', error);
            throw redirect(300, '/dashboard/assistant');
        }

        redirect(303, `/dashboard/assistant/${discussionId}`);

    },
    delete: async ({ request }) => {
        const user = await getProfile();
        if (!user) {
            redirect(300, '/auth');
        }

        const formData = await request.formData();
        const discussion_id = Number(formData.get('discussion_id'));

        try {
            const discussion = await discussionsService.getById(discussion_id);

            if (!discussion) {
                console.error('Discussion not found for deletion');
                throw redirect(300, '/dashboard/assistant');
            }

            if (discussion.profile_id !== user.profile_id) {
                console.error('User does not have access to delete this discussion');
                throw redirect(300, '/dashboard/assistant');
            }

            await discussionsService.delete(discussion_id);
            console.log('Discussion deleted successfully : ID => ', discussion_id);
        } catch (error) {
            console.error('Failed to delete discussion:', error);
            throw redirect(300, '/dashboard/assistant');
        }

        redirect(303, '/dashboard/assistant');
    }
} satisfies Actions;