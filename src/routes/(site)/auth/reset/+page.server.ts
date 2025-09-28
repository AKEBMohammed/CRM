import { supabase } from '$lib/supabase';
import { fail, type Actions } from '@sveltejs/kit';


export const actions = {
    reset: async ({ request, url }) => {
        const formData = await request.formData();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        if (!password || !confirmPassword) {
            return fail(400, { error: 'Both password fields are required' });
        }
        if (password !== confirmPassword) {
            return fail(400, { error: 'Passwords do not match' });
        }

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: password as string,
            });

            if (error) {
                console.error('Error resetting password:', error);
                return fail(400, { error: `Password Reset Error : ${error.message}` });
            }

        } catch (error) {
            console.error('Unexpected error during password reset:', error);
            return fail(500, { error: 'Internal Server Error' });
        }

        // Indicate success to the user
        // Note: Do not redirect immediately to allow user to see the success message
        // They can then navigate to login page manually
        // Alternatively, you could redirect after a short delay using client-side code
        // or provide a link to the login page here.
        return { success: 'Password has been reset successfully. You can now log in with your new password.' };
    }
} satisfies Actions;