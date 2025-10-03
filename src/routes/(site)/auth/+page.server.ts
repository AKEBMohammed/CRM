import type { Actions } from './$types';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { error, fail, redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

async function signUpNewUser(email: string, password: string) {
    // Dynamically set the redirect URL to the dashboard
    const baseUrl = PUBLIC_BASE_URL || 'http://localhost:5173';
    const emailRedirectTo = `${baseUrl}/auth`;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo,
        },
    });

    if (error) {
        console.error('Sign up error:', error);
        throw new Error(error.message);
    }

    // return the created user's data
    return data;
}

async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Sign in error:', error);
        throw new Error(error.message);
    }

    let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user?.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error(profileError.message);
    }


    return {
        user_id: profile.user_id,
        profile_id: profile.profile_id,
        fullname: profile.fullname,
        email: profile.email,
        phone: profile.phone,
        company_id: profile.company_id,
        role: profile.role
    }
}


async function completeProfile(fullname: string, email: string, phone: string, company: string, industry: string, userId: string | null) {
    if (!userId) {
        throw new Error('No user id available to link profile');
    }


    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({ fullname, email, phone, user_id: userId })
        .select('profile_id')
        .single();

    if (profileError) {
        console.error('Error creating profile:', profileError);
        return fail(500, 'Error creating profile:' + profileError.message);
    }

    // Insert company and return its generated company_id
    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ name: company, industry, created_by: profileData?.profile_id }]) // Link company to user_id
        .select('company_id')
        .single();

    if (companyError) {
        console.error('Error creating company:', companyError);
        return fail(500, 'Error creating company:' + companyError.message);
    }

    const { data: updatedProfile, error: updatedProfileError } = await supabase
        .from('profiles')
        .update({ company_id: companyData?.company_id })
        .eq('profile_id', profileData?.profile_id);

    if (updatedProfileError) {
        console.error('Error updating profile company:', updatedProfileError);
        return fail(500, 'Error updating profile company:' + updatedProfileError.message);
    }

    return { profile_id: profileData?.profile_id ?? null, company_id: companyData?.company_id ?? null };
}

export const actions = {
    login: async ({ cookies, request }) => {
        const formData = await request.formData();
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');

        if (!email || !password) {
            return fail(400, { error: 'Email and password are required' });
        }

        try {
            let data = await signInWithEmail(email as string, password as string);

            if (!data) {
                return fail(500, { error: 'Login error: No data returned from signInWithEmail.' })
            }

        } catch (error) {
            console.error('Error signing in:', error);
            return fail(400, { error: `Login Error : ${error}` });
        }

        redirect(303, '/dashboard');


    },
    register: async ({ cookies, request }) => {
        const formData = await request.formData();
        const fullname = formData.get('fullname');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const password = formData.get('password');
        const company = formData.get('company');
        const industry = formData.get('industry');

        // Basic validation
        if (!email || !password || !fullname) {
            return fail(400, { error: 'fullname, email and password are required' });
        }

        try {
            const data = await signUpNewUser(email as string, password as string);

            if (!data) {
                return fail(500, { error: 'Sign up error: We can not create a new user.' })
            }

            await completeProfile(fullname as string, email as string, phone as string, company as string, industry as string, data?.user?.id || null);

        } catch (error) {
            console.error('Error registering:', error);
            return fail(400, { error: `Registration Error : ${error instanceof Error ? error.message : error}` });
        }

        return { success: 'Registration successful! Please check your email to confirm your account.' };

    },
    forget: async ({ cookies, request }) => {
        const formData = await request.formData();
        const email = formData.get('email');

        if (!email) {
            return fail(400, { error: 'Email is required' });
        }

        try {
            const baseUrl = PUBLIC_BASE_URL || 'http://localhost:5173';
            const redirectTo = `${baseUrl}/auth/reset`;
            const { data, error } = await supabase.auth.resetPasswordForEmail(email as string, {
                redirectTo
            });

            if (error) {
                console.error('Error sending password reset email:', error);
                return fail(400, { error: `Error: ${error.message}` });
            }

        } catch (error) {
            console.error('Error in forget action:', error);
            return fail(500, { error: 'Internal Server Error' });
        }

        return { success: 'Password reset email sent. Please check your inbox.' };
    }


} satisfies Actions;