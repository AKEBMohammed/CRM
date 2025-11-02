import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY)

export async function getProfile() {
    let user = await supabase.auth.getUser();

    if( !user ) redirect(300,'/auth')

    let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.data.user?.id)
        .single();
    
    if( error ) return null;

    return {
        user_id: user.data.user?.id,
        profile_id: data.profile_id,
        fullname: data.fullname,
        email: data.email,
        phone: data.phone,
        company_id: data.company_id,
        role: data.role,
    }
}