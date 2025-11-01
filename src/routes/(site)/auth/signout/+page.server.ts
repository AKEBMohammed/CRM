import { getProfile, supabase } from "$lib/supabase";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	let user = await getProfile();
	if (!user) {
		redirect(304, '/auth');
	}
	await supabase.auth.signOut();
	redirect(304, '/auth');
}