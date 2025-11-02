import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit'; 
import { getProfile } from '$lib/supabase';
import { profilesService } from "$lib/services";

// ... (Your PageServerLoad function remains the same) ...
export const load: PageServerLoad = async () => {
    let user = await getProfile();

    if (!user) {
        redirect(308, '/auth');
    }
    return { user };
};


export const actions: Actions = {
    update_profile: async ({ request }) => {
        try {
            // 1. Get current user profile (which includes the current data)
            const currentUser = await getProfile();
            
            if(!currentUser || !currentUser.profile_id) {
                return fail(401, { error: 'Unauthorized access. Please log in again.'});
            }

            // 2. Extract submitted form data, ensuring consistent trimming
            const formData = await request.formData();
            const fullname = formData.get("fullname")?.toString().trim() || "";
            const email = formData.get("email")?.toString().trim() || "";
            const phone = formData.get("phone")?.toString().trim() || "";
            
            // 3. Validation Check
            if (!fullname || !email || !phone) {
                return fail(400, {error: 'All fields are required.'});
            }

           
            const currentProfileData = {
                fullname: currentUser.fullname?.trim() || "",
                email: currentUser.email?.trim() || "",
                phone: currentUser.phone?.trim() || "",
            };

            const submittedData = { fullname, email, phone };

            const noChangeDetected = (
                submittedData.fullname === currentProfileData.fullname &&
                submittedData.email === currentProfileData.email &&
                submittedData.phone === currentProfileData.phone
            );

            if (noChangeDetected) {
                // If no changes, return a success message without calling the update service.
                console.log(`Profile submitted, but no changes detected for user ${currentUser.profile_id}. Skipping DB call.`);
                return { 
                    success: "Profile details are already up to date. No changes were saved." 
                };
            }

            // 5. Execute DB Update ONLY if changes were detected
            const updatedProfile = await profilesService.update(currentUser.profile_id, {
                fullname,
                email,
                phone
            });

            if (!updatedProfile) {
                return fail(500, { error: "Failed to update profile." });
            }

            return { success: "Profile updated successfully." };

        } catch (err) {
            console.error("Error updating profile:", err);
            return fail(500, { error: "Internal error updating profile." });
        }
    }
};