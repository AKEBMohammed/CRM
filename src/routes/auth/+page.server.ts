import type { Actions } from './$types';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

async function signUpNewUser(email: string, password: string) {
    // Dynamically set the redirect URL to the dashboard
    const baseUrl = PUBLIC_BASE_URL || 'http://localhost:5173';
    const emailRedirectTo = `${baseUrl}/dashboard`;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo,
        },
    });
}

async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
}

async function fillProfile(fullname: string, company: string, industry: string) {
    const user = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('companies')
        .insert([{ name: company, industry }]);
            
    if (error) {
        console.error('Error updating profile:', error);
        throw `Registration Error : ${error.message}`;
    }

    const companyId = data ? data[0].id : null;

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ fullname, company_id: companyId })
        .eq('user_id', user.data.user?.user_id);

    if (profileError) {
        console.error('Error updating profile:', profileError);
        throw `Profile Update Error : ${profileError.message}`;
    }
    return;

}

export const actions = {
    login: async ({ cookies, request }) => {
        const formData = await request.formData();
        const email = formData.get('email');
        const password = formData.get('password');
        

        try {
            await signInWithEmail(email as string, password as string);
        } catch (error) {
            console.error('Error signing in:', error);
            return fail(400, { error: `Login Error : ${error}` });
        }


    },
    register: async ({ cookies, request }) => {
        const formData = await request.formData();
        const fullname = formData.get('fullname');
        const email = formData.get('email');
        const password = formData.get('password');
        const company = formData.get('company');
        const industry = formData.get('industry');

        try {
            await signUpNewUser(email as string, password as string);
            await fillProfile(fullname as string, company as string, industry as string);
        } catch (error) {
            console.error('Error registering:', error);
            return fail(400, { error: `Registration Error : ${error}` });
        }

    }
} satisfies Actions;