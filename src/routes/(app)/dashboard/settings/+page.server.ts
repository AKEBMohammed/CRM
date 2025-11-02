import type { PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit'; 
import { getProfile } from '$lib/supabase';
import { profilesService } from "$lib/services";


export const load: PageServerLoad = async () => {
    let user = await getProfile();

    if (!user) {
        redirect(308, '/auth');
    }
    return { user  };
};


export const actions = {
  update_profile: async ({ request }) => {
    try {
      const user = await getProfile();
      if(!user) {
        return fail(401, { error: 'Unauthorized access. Please log in again.'});
      }

      const formData = await request.formData();
      const fullname = formData.get("fullname")?.toString().trim() || "";
      const email = formData.get("email")?.toString().trim() || "";
      const phone = formData.get("phone")?.toString().trim() || "";
      

      if (!fullname || !email || !phone) {
        return fail(400, {error: 'All fields are required.'});
      }

      const updatedProfile = await profilesService.update(user.profile_id, {
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

