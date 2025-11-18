import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { dealsService, contactsService, productsService } from "$lib/services";
import { getProfile } from "$lib/supabase";




export const load: PageServerLoad = async ({ cookies }) => {
    const user = await getProfile();
    
    if (!user) {
        redirect(300, '/auth');
    }

    try {
        const [deals, contacts, products] = await Promise.all([
            dealsService.getAll(user.profile_id,user.company_id),
            contactsService.getAll(user.company_id),
            productsService.getAll(user.company_id)
        ]);

        return { 
            deals: deals || [], 
            contacts: contacts || [], 
            products: products || [] 
        };
    } catch (error) {
        console.error('Failed to fetch deals data:', error);
        return { deals: [], contacts: [], products: [] };
    }
};


export const actions = {
    add: async ({ request, cookies }) => {
        const user = await getProfile();
        
        if (!user) {
            return fail(401, { error: 'Unauthorized access. Please log in again.' });
        }

        const formData = await request.formData();
        const title = formData.get('title');
        const value = formData.get('value');
        const stage = formData.get('stage');
        const probability = formData.get('probability');
        const contact_id = formData.get('contact_id');
        const product_id = formData.get('product_id');

        if (!title || !value || !stage || !probability || !contact_id || !product_id) {
            return fail(400, { error: 'All fields are required.' });
        }

        try {
            const deal = await dealsService.create({
                title: title.toString(),
                value: Number(value),
                stage: stage.toString(),
                probability: Number(probability),
                contact_id: Number(contact_id),
                product_id: Number(product_id),
                profile_id: user.profile_id,
            });

            if (!deal) {
                return fail(500, { error: 'Failed to create deal. Please try again later.' });
            }

            return { success: 'Deal created successfully!' };
        } catch (error) {
            console.error('Add deal error:', error);
            return fail(500, { error: 'Failed to create deal. Please try again later.' });
        }
    }
} satisfies Actions;